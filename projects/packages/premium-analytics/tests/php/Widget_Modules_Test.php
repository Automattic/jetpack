<?php
/**
 * Tests for Premium Analytics widget module discovery.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\TestCase;
use WP_REST_Server;

require_once __DIR__ . '/../../src/widget-modules.php';

/**
 * Tests for Premium Analytics widget module discovery.
 */
class Widget_Modules_Test extends TestCase {

	const ROUTE        = '/wpcom/v2/widget-modules';
	const LEGACY_ROUTE = '/jetpack/v4/widget-modules';

	/**
	 * Reset REST globals after route registration tests.
	 */
	protected function tearDown(): void {
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tearDown();
	}

	/**
	 * The widget module discovery route uses the WPCOM namespace.
	 */
	public function test_widget_modules_route_uses_wpcom_v2_namespace() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		if ( false === has_action( 'rest_api_init', __NAMESPACE__ . '\\register_widget_modules_rest_route' ) ) {
			add_action( 'rest_api_init', __NAMESPACE__ . '\\register_widget_modules_rest_route' );
		}

		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertArrayNotHasKey( self::LEGACY_ROUTE, $routes );
	}

	/**
	 * The route's callback works standalone: it hydrates the widget type
	 * registry itself (ensure_widget_registry_ready()) rather than assuming a
	 * caller already did, so it returns valid data even when nothing else in
	 * the process has touched the registry yet.
	 */
	public function test_response_hydrates_the_registry_on_first_use() {
		$response = get_widget_modules_response();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertIsArray( $response->get_data() );
	}
}
