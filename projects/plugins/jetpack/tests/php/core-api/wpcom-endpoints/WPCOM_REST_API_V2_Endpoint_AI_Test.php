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

	const BASIC_ROUTE = '/wpcom/v2/jetpack-ai/ai-assistant-feature';
	const GATED_ROUTE = '/wpcom/v2/jetpack-ai/completions';

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_ai_enabled' );

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
	}
}
