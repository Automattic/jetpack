<?php
/**
 * Tests for /wpcom/v2/jetpack-ai endpoints.
 *
 * Focused on the deferral introduced in JETPACK-1747: the constructor no longer
 * loads Jetpack_AI_Helper or evaluates the AI feature gate — that work moved
 * into maybe_register_routes() on rest_api_init. The load-bearing test here is
 * the gate-timing one: because the gate is evaluated at rest_api_init rather
 * than at construction, a `jetpack_ai_enabled` filter added after the endpoint
 * is constructed but before rest_api_init fires now reaches route registration.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI
 * @covers \Jetpack_AI_Helper::get_ai_assistance_feature
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI::class )]
#[CoversMethod( Jetpack_AI_Helper::class, 'get_ai_assistance_feature' )]
class WPCOM_REST_API_V2_Endpoint_AI_Test extends Jetpack_REST_TestCase {

	use \Activates_Ai_Module;

	const BASIC_ROUTE        = '/wpcom/v2/jetpack-ai/ai-assistant-feature';
	const GATED_ROUTE        = '/wpcom/v2/jetpack-ai/completions';
	const GATED_IMAGES_ROUTE = '/wpcom/v2/jetpack-ai/images/generations';

	const CHAT_SEARCH_ROUTE = '/wpcom/v2/jetpack-search/ai/search';
	const CHAT_RANK_ROUTE   = '/wpcom/v2/jetpack-search/ai/rank';

	/**
	 * Transient created by a cache-behavior test.
	 *
	 * @var string|null
	 */
	private $ai_feature_transient_name;

	/**
	 * Reset the environment to its original state after the test.
	 *
	 * Only the filters this test adds are removed — not remove_all_filters(),
	 * which would also drop a platform-registered `jetpack_ai_enabled` /
	 * `jetpack_ai_chat_enabled` filter (e.g. on WordPress.com) and leak that
	 * into later tests.
	 */
	/**
	 * Off-Simple the `ai` module is the AI master, and the gated routes now register
	 * only when is_ai_enabled() — which reads the module — is true. The PHPUnit env
	 * never activates it, so force it on; the disabled cases force the gate off via
	 * the jetpack_ai_enabled filter, which wins regardless of module state.
	 */
	public function set_up() {
		parent::set_up();
		$this->activate_ai_module_for_test();
	}

	public function tear_down() {
		if ( $this->ai_feature_transient_name ) {
			delete_transient( $this->ai_feature_transient_name );
		}
		$this->set_ai_assistant_failed_request( null );
		$this->deactivate_ai_module_for_test();
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );

		parent::tear_down();
	}

	/**
	 * Configure a connected owner for the remote AI feature request.
	 *
	 * @return string Transient name used by the feature cache.
	 */
	private function prepare_ai_feature_request() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$blog_id = 123456;
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'id', $blog_id );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );

		$this->ai_feature_transient_name = \Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( $blog_id );
		delete_transient( $this->ai_feature_transient_name );

		return $this->ai_feature_transient_name;
	}

	/**
	 * Set the request-local failure cache for a regression assertion.
	 *
	 * @param WP_Error|null $value Cached request failure.
	 */
	private function set_ai_assistant_failed_request( $value ) {
		$property = new ReflectionProperty( \Jetpack_AI_Helper::class, 'ai_assistant_failed_request' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
	}

	/**
	 * Read the request-local failure cache for a regression assertion.
	 *
	 * @return WP_Error|null
	 */
	private function get_ai_assistant_failed_request() {
		$property = new ReflectionProperty( \Jetpack_AI_Helper::class, 'ai_assistant_failed_request' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		return $property->getValue();
	}

	/**
	 * Swap in a fresh spy REST server and fire rest_api_init, returning the
	 * resulting route table. The endpoint object is constructed once at
	 * plugins_loaded (test bootstrap) and stays hooked on rest_api_init, so
	 * re-firing against a clean server re-runs maybe_register_routes().
	 *
	 * @return array The registered routes, keyed by path.
	 */
	private function register_routes_on_fresh_server() {
		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );

		return $wp_rest_server->get_routes();
	}

	public function test_ungated_route_registers_on_rest_api_init() {
		/*
		 * register_basic_routes() is ungated, so the route registers whenever
		 * maybe_register_routes() runs on rest_api_init.
		 */
		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::BASIC_ROUTE,
			$routes,
			'The ungated jetpack-ai route must register on rest_api_init.'
		);
	}

	public function test_ai_assistant_feature_route_accepts_cache_bypass() {
		$routes = $this->register_routes_on_fresh_server();
		$args   = $routes[ self::BASIC_ROUTE ][0]['args'];

		$this->assertArrayHasKey( 'skip_cache', $args );
		$this->assertFalse( $args['skip_cache']['default'] );
		$this->assertSame( 'boolean', $args['skip_cache']['type'] );
		$this->assertSame( 'rest_sanitize_boolean', $args['skip_cache']['sanitize_callback'] );
	}

	/**
	 * A forced refresh bypasses a warm transient and clears a request-local failure.
	 */
	public function test_ai_assistant_feature_cache_bypass_fetches_fresh_data() {
		$transient_name = $this->prepare_ai_feature_request();
		$fresh_data     = array( 'requests-count' => 2 );
		$request_count  = 0;
		set_transient( $transient_name, array( 'requests-count' => 1 ), 60 );
		$this->set_ai_assistant_failed_request( new WP_Error( 'previous_failure' ) );

		$mock_request = static function () use ( &$request_count, $fresh_data ) {
			++$request_count;
			return array(
				'headers'  => array(),
				'body'     => wp_json_encode( $fresh_data, JSON_HEX_TAG | JSON_HEX_AMP ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
			);
		};
		add_filter( 'pre_http_request', $mock_request );

		$result = \Jetpack_AI_Helper::get_ai_assistance_feature( true );

		remove_filter( 'pre_http_request', $mock_request );
		$this->assertSame( 1, $request_count );
		$this->assertSame( $fresh_data, $result );
		$this->assertSame( $fresh_data, get_transient( $transient_name ) );
		$this->assertNull( $this->get_ai_assistant_failed_request() );
	}

	/**
	 * A failed forced refresh leaves an existing successful response cached.
	 */
	public function test_failed_ai_assistant_feature_cache_bypass_preserves_warm_cache() {
		$transient_name = $this->prepare_ai_feature_request();
		$cached_data    = array( 'requests-count' => 1 );
		set_transient( $transient_name, $cached_data, 60 );

		$mock_request = static function () {
			return array(
				'headers'  => array(),
				'body'     => '',
				'response' => array(
					'code'    => 500,
					'message' => 'Server Error',
				),
				'cookies'  => array(),
			);
		};
		add_filter( 'pre_http_request', $mock_request );

		$result = \Jetpack_AI_Helper::get_ai_assistance_feature( true );

		remove_filter( 'pre_http_request', $mock_request );
		$this->assertWPError( $result );
		$this->assertSame( $cached_data, get_transient( $transient_name ) );
	}

	public function test_gated_routes_stay_unregistered_when_ai_disabled() {
		/*
		 * Force the gate off so the result is independent of the host — on
		 * WPCOM/WoA is_enabled() would otherwise default to true.
		 */
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::BASIC_ROUTE,
			$routes,
			'The ungated route registers regardless of the AI gate.'
		);
		$this->assertArrayNotHasKey(
			self::GATED_ROUTE,
			$routes,
			'AI-gated routes must not register when Jetpack AI is disabled.'
		);
		$this->assertArrayNotHasKey(
			self::GATED_IMAGES_ROUTE,
			$routes,
			'The image-generation route is gated too and must not register when Jetpack AI is disabled.'
		);
	}

	public function test_jetpack_ai_enabled_filter_before_rest_api_init_registers_gated_routes() {
		/*
		 * The gate (Jetpack_AI_Helper::is_enabled()) is evaluated inside the
		 * rest_api_init callback rather than in the constructor, so a filter
		 * added after the endpoint is constructed but before rest_api_init fires
		 * still reaches route registration. Were the gate evaluated in the
		 * constructor (the pre-deferral behavior), this filter would be too late
		 * and the gated route would not register — so this is the deferral's
		 * regression guard.
		 */
		add_filter( 'jetpack_ai_enabled', '__return_true' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::GATED_ROUTE,
			$routes,
			'AI-gated routes must register when jetpack_ai_enabled is filtered true before rest_api_init.'
		);
		$this->assertArrayHasKey(
			self::GATED_IMAGES_ROUTE,
			$routes,
			'The image-generation route must register alongside completions when jetpack_ai_enabled is filtered true before rest_api_init.'
		);
	}

	public function test_ai_chat_routes_register_when_chat_enabled_before_rest_api_init() {
		/*
		 * The AI Chat routes sit behind a second gate, Jetpack_AI_Helper::is_ai_chat_enabled()
		 * (the `jetpack_ai_chat_enabled` filter), evaluated in maybe_register_routes()
		 * independently of the is_enabled() gate. Like the completions gate, it now runs at
		 * rest_api_init, so a filter added before the hook fires reaches registration.
		 */
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::CHAT_SEARCH_ROUTE,
			$routes,
			'The AI Chat search route must register when jetpack_ai_chat_enabled is filtered true before rest_api_init.'
		);
		$this->assertArrayHasKey(
			self::CHAT_RANK_ROUTE,
			$routes,
			'The AI Chat rank route must register when jetpack_ai_chat_enabled is filtered true before rest_api_init.'
		);
	}

	public function test_ai_chat_routes_stay_unregistered_when_chat_disabled() {
		/*
		 * Force the chat gate off so the result is independent of the host. The basic route
		 * stays registered because it is ungated, proving the chat gate alone controls the
		 * chat routes.
		 */
		add_filter( 'jetpack_ai_chat_enabled', '__return_false' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::BASIC_ROUTE,
			$routes,
			'The ungated route registers regardless of the AI Chat gate.'
		);
		$this->assertArrayNotHasKey(
			self::CHAT_SEARCH_ROUTE,
			$routes,
			'The AI Chat search route must not register when AI Chat is disabled.'
		);
		$this->assertArrayNotHasKey(
			self::CHAT_RANK_ROUTE,
			$routes,
			'The AI Chat rank route must not register when AI Chat is disabled.'
		);
	}
}
