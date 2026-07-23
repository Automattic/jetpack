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
	public function tear_down() {
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );

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
