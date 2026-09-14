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

use Automattic\Jetpack\Search\Plan;
use Automattic\Jetpack\Search\Search_Blocks;
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

	const CHAT_SEARCH_ROUTE = '/wpcom/v2/jetpack-search/ai/search';
	const CHAT_RANK_ROUTE   = '/wpcom/v2/jetpack-search/ai/rank';

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
		// @phan-suppress-next-line PhanAccessMethodInternal -- Reset the shared package memo between test cases.
		Search_Blocks::reset_supports_paid_search_cache();
	}

	public function tear_down() {
		$this->deactivate_ai_module_for_test();
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_ai_search_response' ) );
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		// @phan-suppress-next-line PhanAccessMethodInternal -- Reset the shared package memo between test cases.
		Search_Blocks::reset_supports_paid_search_cache();

		parent::tear_down();
	}

	/**
	 * Simulate a blog-level connection so signed requests can be built.
	 */
	private function simulate_connection() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'asd.qwe' );
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Body/status returned by mock_wpcom_ai_search_response(); set per test.
	 *
	 * @var array
	 */
	private $mocked_wpcom_response_body = array();

	/**
	 * @var int
	 */
	private $mocked_wpcom_response_status = 200;

	/**
	 * Stand-in for the wpcom `/jetpack-search/ai/search` response, hooked on
	 * `pre_http_request` so the underlying signed request never leaves the
	 * process.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args    HTTP request arguments.
	 * @param string $url     The request URL.
	 * @return array|false
	 */
	public function mock_wpcom_ai_search_response( $preempt, $args, $url ) {
		if ( strpos( $url, 'jetpack-search/ai/search' ) === false ) {
			return $preempt;
		}
		return array(
			'body'     => wp_json_encode( $this->mocked_wpcom_response_body, JSON_UNESCAPED_SLASHES ),
			'response' => array( 'code' => $this->mocked_wpcom_response_status ),
		);
	}

	/**
	 * The proxy must forward the real upstream error code, message, and HTTP
	 * status instead of collapsing every failure into invalid_ask_response /
	 * 500. See SEARCH-351.
	 */
	public function test_request_chat_with_site_forwards_upstream_error() {
		$this->simulate_connection();
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		$this->mocked_wpcom_response_body   = array(
			'code'    => 'ai_search_inactive',
			'message' => 'This site is not able to use the Jetpack AI Search feature',
		);
		$this->mocked_wpcom_response_status = 403;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_ai_search_response' ), 10, 3 );

		$this->register_routes_on_fresh_server();
		$request = new WP_REST_Request( 'GET', self::CHAT_SEARCH_ROUTE );
		$request->set_param( 'query', 'What is this website?' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'ai_search_inactive', $response->get_data()['code'] );
		$this->assertSame(
			'This site is not able to use the Jetpack AI Search feature',
			$response->get_data()['message']
		);
	}

	/**
	 * A response that is neither an upstream error nor a valid answer (no
	 * `cache_key`, no `code`) still falls back to the generic error.
	 */
	public function test_request_chat_with_site_falls_back_to_generic_error() {
		$this->simulate_connection();
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		$this->mocked_wpcom_response_body   = array( 'unexpected' => 'shape' );
		$this->mocked_wpcom_response_status = 200;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_ai_search_response' ), 10, 3 );

		$this->register_routes_on_fresh_server();
		$request = new WP_REST_Request( 'GET', self::CHAT_SEARCH_ROUTE );
		$request->set_param( 'query', 'What is this website?' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_ask_response', $response->get_data()['code'] );
	}

	/**
	 * A 200 response with a valid cache_key is a real answer, even if it
	 * also carries an unrelated `code` field.
	 */
	public function test_request_chat_with_site_succeeds_with_code_and_cache_key_present() {
		$this->simulate_connection();
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		$this->mocked_wpcom_response_body   = array(
			'code'      => 'ok',
			'cache_key' => 'jp-search-ai-123',
		);
		$this->mocked_wpcom_response_status = 200;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_ai_search_response' ), 10, 3 );

		$this->register_routes_on_fresh_server();
		$request = new WP_REST_Request( 'GET', self::CHAT_SEARCH_ROUTE );
		$request->set_param( 'query', 'What is this website?' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Non-scalar code/message in the upstream error body (unexpected JSON
	 * shape) fall back to the generic error instead of fataling.
	 */
	public function test_request_chat_with_site_falls_back_when_code_is_non_scalar() {
		$this->simulate_connection();
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		$this->mocked_wpcom_response_body   = array(
			'code'    => array( 'nested' => 'shape' ),
			'message' => array( 'nested' => 'shape' ),
		);
		$this->mocked_wpcom_response_status = 403;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_ai_search_response' ), 10, 3 );

		$this->register_routes_on_fresh_server();
		$request = new WP_REST_Request( 'GET', self::CHAT_SEARCH_ROUTE );
		$request->set_param( 'query', 'What is this website?' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'invalid_ask_response', $response->get_data()['code'] );
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
		$this->simulate_connection();
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
