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

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI::class )]
class WPCOM_REST_API_V2_Endpoint_AI_Test extends Jetpack_REST_TestCase {

	use \Activates_Ai_Module;

	const BASIC_ROUTE        = '/wpcom/v2/jetpack-ai/ai-assistant-feature';
	const GATED_ROUTE        = '/wpcom/v2/jetpack-ai/completions';
	const GATED_IMAGES_ROUTE = '/wpcom/v2/jetpack-ai/images/generations';
	const BLOG_ID            = 1234;

	const CHAT_SEARCH_ROUTE = '/wpcom/v2/jetpack-search/ai/search';
	const CHAT_RANK_ROUTE   = '/wpcom/v2/jetpack-search/ai/rank';

	/**
	 * Current HTTP mock callback.
	 *
	 * @var callable|null
	 */
	private $pre_http_request_filter;

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
		$this->deactivate_ai_module_for_test();
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		if ( $this->pre_http_request_filter ) {
			remove_filter( 'pre_http_request', $this->pre_http_request_filter, 10 );
			$this->pre_http_request_filter = null;
		}
		delete_transient( Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( self::BLOG_ID ) );
		delete_transient( Jetpack_AI_Helper::transient_name_for_ai_assistance_feature_refresh( self::BLOG_ID ) );
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'master_user', 'user_tokens' ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		wp_set_current_user( 0 );

		parent::tear_down();
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
		$this->assertSame( 'boolean', $routes[ self::BASIC_ROUTE ][0]['args']['skip_cache']['type'] );
		$this->assertFalse( $routes[ self::BASIC_ROUTE ][0]['args']['skip_cache']['default'] );
	}

	/**
	 * The REST callback forwards skip_cache to the helper.
	 */
	public function test_ai_assistance_feature_route_passes_skip_cache_to_helper() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'id', self::BLOG_ID );
		Jetpack_Options::update_option( 'blog_token', 'blog.secret' );
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();

		$cached         = array( 'requests-count' => 3 );
		$fresh          = array( 'requests-count' => 4 );
		$transient_name = Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( self::BLOG_ID );
		$request_count  = 0;
		set_transient( $transient_name, $cached, MINUTE_IN_SECONDS );
		$this->pre_http_request_filter = static function ( $preempt, $parsed_args, $url ) use ( $fresh, &$request_count ) {
			$is_feature_request = false !== strpos( $url, '/sites/' . self::BLOG_ID . '/jetpack-ai/ai-assistant-feature' );
			if ( 'GET' !== $parsed_args['method'] || ! $is_feature_request ) {
				return $preempt;
			}

			++$request_count;

			return array(
				'headers'  => array( 'content-type' => 'application/json' ),
				'body'     => wp_json_encode( $fresh, JSON_UNESCAPED_SLASHES ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
			);
		};
		add_filter( 'pre_http_request', $this->pre_http_request_filter, 10, 3 );

		$request = new WP_REST_Request( 'GET', self::BASIC_ROUTE );
		$request->set_param( 'skip_cache', true );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $fresh, $response->get_data() );
		$this->assertSame( 1, $request_count );

		$coalesced_response = $this->server->dispatch( $request );
		$this->assertSame( 200, $coalesced_response->get_status() );
		$this->assertSame( $fresh, $coalesced_response->get_data() );
		$this->assertSame( 1, $request_count );
	}

	/**
	 * The local endpoint passes a versioned cost-credit response through unchanged.
	 */
	public function test_ai_assistance_feature_route_returns_cost_credit_contract() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'id', self::BLOG_ID );

		$credit_response = array(
			'ai-credit-allowance' => array(
				'schema-version'    => 1,
				'metering-model'    => 'provider-cost-v1',
				'policy'            => 'jetpack-ai-self-hosted-monthly-v1',
				'plan-kind'         => 'free',
				'authoritative'     => true,
				'credit-limit'      => 1000,
				'credits-used'      => 250,
				'credits-remaining' => 750,
				'period-start'      => '2026-08-01T00:00:00+00:00',
				'resets-at'         => '2026-09-01T00:00:00+00:00',
				'rollover'          => false,
				'is-exhausted'      => false,
			),
		);
		set_transient(
			Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( self::BLOG_ID ),
			$credit_response,
			MINUTE_IN_SECONDS
		);

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::BASIC_ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $credit_response, $response->get_data() );
	}

	/**
	 * The local endpoint preserves an authoritative zero-credit response.
	 */
	public function test_ai_assistance_feature_route_returns_zero_cost_credit_contract() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'id', self::BLOG_ID );

		$credit_response = array(
			'ai-credit-allowance' => array(
				'schema-version'    => 1,
				'metering-model'    => 'provider-cost-v1',
				'policy'            => 'jetpack-ai-self-hosted-monthly-v1',
				'plan-kind'         => 'free',
				'authoritative'     => true,
				'credit-limit'      => 0,
				'credits-used'      => 0,
				'credits-remaining' => 0,
				'period-start'      => '2026-08-01T00:00:00+00:00',
				'resets-at'         => '2026-09-01T00:00:00+00:00',
				'rollover'          => false,
				'is-exhausted'      => true,
			),
		);
		set_transient(
			Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( self::BLOG_ID ),
			$credit_response,
			MINUTE_IN_SECONDS
		);

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::BASIC_ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $credit_response, $response->get_data() );
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
