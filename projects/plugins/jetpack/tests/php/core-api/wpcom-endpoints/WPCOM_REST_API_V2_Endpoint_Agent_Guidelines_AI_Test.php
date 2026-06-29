<?php
/**
 * Tests for the /wpcom/v2/jetpack-ai/suggest-guidelines endpoint wrapper.
 *
 * Focused on the deferral introduced in JETPACK-1747: the Jetpack_AI_Helper load
 * and the is_enabled() gate moved out of the constructor into maybe_register_routes()
 * on rest_api_init. The contract worth locking down is the enabled/disabled matrix
 * evaluated at hook time, plus the registered route's method and permission callback.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI::class )]
class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI_Test extends Jetpack_REST_TestCase {

	const ROUTE = '/wpcom/v2/jetpack-ai/suggest-guidelines';

	/**
	 * Reset the environment to its original state after the test.
	 *
	 * Only the filters this test adds are removed — not remove_all_filters(),
	 * which would also drop a platform-registered `jetpack_ai_enabled` filter
	 * (e.g. on WordPress.com) and leak that into later tests.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_enabled', '__return_true' );

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

	/**
	 * Normalize a route handler's `methods` (assoc array or comma string,
	 * depending on WP version) to a list of HTTP methods.
	 *
	 * @param array $handler A single route handler config.
	 * @return string[] The HTTP methods the handler responds to.
	 */
	private function route_methods( array $handler ) {
		$methods = $handler['methods'];

		return is_array( $methods )
			? array_keys( array_filter( $methods ) )
			: array_map( 'trim', explode( ',', (string) $methods ) );
	}

	public function test_route_registers_when_ai_enabled_before_rest_api_init() {
		/*
		 * The gate (Jetpack_AI_Helper::is_enabled()) now runs in the rest_api_init
		 * callback, so a filter added before the hook fires reaches registration.
		 */
		add_filter( 'jetpack_ai_enabled', '__return_true' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayHasKey(
			self::ROUTE,
			$routes,
			'The suggest-guidelines route must register when Jetpack AI is enabled before rest_api_init.'
		);

		$handler = $routes[ self::ROUTE ][0];
		$this->assertContains(
			'POST',
			$this->route_methods( $handler ),
			'The suggest-guidelines route must respond to POST (WP_REST_Server::CREATABLE).'
		);
		$this->assertIsArray(
			$handler['permission_callback'],
			'The suggest-guidelines route must keep its permission_callback method.'
		);
		$this->assertSame(
			'permission_callback',
			$handler['permission_callback'][1],
			'The suggest-guidelines route must be guarded by the endpoint permission_callback.'
		);
	}

	public function test_route_absent_when_ai_disabled() {
		/*
		 * Force the gate off so the result is independent of the host — on
		 * WPCOM/WoA is_enabled() would otherwise default to true.
		 */
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		$routes = $this->register_routes_on_fresh_server();

		$this->assertArrayNotHasKey(
			self::ROUTE,
			$routes,
			'The suggest-guidelines route must not register when Jetpack AI is disabled.'
		);
	}
}
