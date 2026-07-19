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
		parent::tearDown();
	}

	/**
	 * A host that has loaded nothing else from this package can call
	 * register() and get all three dashboard support routes.
	 *
	 * This is the exact contract WPCOM's public-api process relies on: it
	 * never calls Analytics::init(), only this one method.
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
	 * Calling it a second time (e.g. from a second host hook) does not
	 * register a route twice or error.
	 */
	public function test_register_is_safe_to_call_twice() {
		Dashboard_Support_Routes::register();
		Dashboard_Support_Routes::register();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'init' );
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/widget-modules', $routes );
		$this->assertCount( 1, $routes['/wpcom/v2/widget-modules'] );
	}
}
