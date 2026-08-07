<?php
/**
 * Tests for the single-entry-point dashboard support route registration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\TestCase;
use WP_REST_Server;

/**
 * Tests for Dashboard_Support_Routes.
 */
class Dashboard_Support_Routes_Test extends TestCase {

	/**
	 * Reset REST globals and hooks after route registration tests.
	 */
	protected function tearDown(): void {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'init' );
		Capabilities::unregister();
		parent::tearDown();
	}

	/**
	 * Standalone register() registers all three routes — the contract
	 * WPCOM's public-api process relies on.
	 */
	public function test_register_registers_all_three_routes() {
		Dashboard_Support_Routes::register();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'init' );
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/widget-modules', $routes );
		$this->assertArrayHasKey(
			'/wpcom/v2/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*)/default-layout',
			$routes
		);
		$this->assertArrayHasKey( '/wpcom/v2/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*)/sections', $routes );
	}

	/**
	 * Calling it twice doesn't register a route twice or error.
	 */
	public function test_register_is_safe_to_call_twice() {
		Dashboard_Support_Routes::register();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Intentional: testing that a second call is a no-op.
		Dashboard_Support_Routes::register();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'init' );
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/widget-modules', $routes );
		$this->assertCount( 1, $routes['/wpcom/v2/widget-modules'] );
	}

	/**
	 * Booting standalone also maps the capability these routes are gated on.
	 * WPCOM Simple takes this path without ever calling Analytics::init(), so
	 * without the mapping every request to them would be refused.
	 */
	public function test_boot_routes_maps_the_dashboard_capability() {
		Dashboard_Support_Routes::register();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'init' );
		do_action( 'rest_api_init' );

		$this->assertNotFalse(
			has_filter( 'map_meta_cap', array( Capabilities::class, 'map_meta_caps' ) )
		);
	}
}
