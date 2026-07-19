<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Analytics class.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Analytics
 */
#[CoversClass( Analytics::class )]
class Analytics_Test extends TestCase {

	/**
	 * Reset request and screen globals touched by the dashboard-request tests.
	 */
	protected function tearDown(): void {
		unset( $_GET['page'] );
		unset( $GLOBALS['current_screen'] );
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'jetpack_sync_processed_actions' );
		remove_all_actions( 'plugins_loaded' );
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'jetpack-premium-analytics_init' );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'rest_post_dispatch' );
		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );
		$this->reset_analytics_init_state();
		parent::tearDown();
	}

	/**
	 * Reset the one-shot init guard between tests.
	 */
	private function reset_analytics_init_state() {
		$property = new \ReflectionProperty( Analytics::class, 'initialized' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );
	}

	/**
	 * Test that the Analytics class can be instantiated.
	 */
	public function test_class_exists() {
		$this->assertTrue( class_exists( Analytics::class ) );
	}

	/**
	 * Normal package bootstrap registers the local proxy cache cleanup hook.
	 */
	public function test_init_registers_local_proxy_by_default() {
		$this->reset_analytics_init_state();

		Analytics::init();

		$this->assertNotFalse( has_filter( 'jetpack_stats_transient_cleanup_prefixes' ) );
	}

	/**
	 * WordPress.com Simple mode skips local proxy registration.
	 */
	public function test_init_skips_local_proxy_in_wpcom_simple_mode() {
		$this->reset_analytics_init_state();

		Analytics::init_wpcom_simple();

		$this->assertFalse( has_filter( 'jetpack_stats_transient_cleanup_prefixes' ) );
	}

	/**
	 * Normal package bootstrap serves the dashboard support routes from the site.
	 *
	 * The route files themselves are loaded lazily, on rest_api_init, via
	 * Dashboard_Support_Routes::boot_routes() - so this checks that hook is
	 * wired, then dispatches it and confirms the routes actually land.
	 */
	public function test_init_registers_dashboard_support_routes_by_default() {
		$this->reset_analytics_init_state();

		Analytics::init();

		$this->assertNotFalse(
			has_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) )
		);

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wpcom/v2/widget-modules', $routes );
	}

	/**
	 * WordPress.com Simple mode leaves the dashboard support routes to public-api.
	 */
	public function test_init_skips_dashboard_support_routes_in_wpcom_simple_mode() {
		$this->reset_analytics_init_state();

		Analytics::init_wpcom_simple();

		$this->assertFalse(
			has_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) )
		);
	}

	/**
	 * The full-page dashboard slug in admin is recognized as a dashboard request.
	 */
	public function test_is_dashboard_request_true_for_full_page_slug() {
		set_current_screen( 'toplevel_page_jetpack-premium-analytics' );
		$_GET['page'] = 'jetpack-premium-analytics';

		$this->assertTrue( Analytics::is_dashboard_request() );
	}

	/**
	 * The wp-admin integrated dashboard slug in admin is recognized as a dashboard request.
	 */
	public function test_is_dashboard_request_true_for_wp_admin_slug() {
		set_current_screen( 'toplevel_page_jetpack-premium-analytics' );
		$_GET['page'] = 'jetpack-premium-analytics-wp-admin';

		$this->assertTrue( Analytics::is_dashboard_request() );
	}

	/**
	 * Any other admin page is not a dashboard request (so polyfills must not load there).
	 */
	public function test_is_dashboard_request_false_for_other_admin_page() {
		set_current_screen( 'edit-post' );
		$_GET['page'] = 'some-other-plugin';

		$this->assertFalse( Analytics::is_dashboard_request() );
	}

	/**
	 * An admin request with no page parameter is not a dashboard request.
	 */
	public function test_is_dashboard_request_false_when_no_page_param() {
		set_current_screen( 'edit-post' );
		unset( $_GET['page'] );

		$this->assertFalse( Analytics::is_dashboard_request() );
	}

	/**
	 * A front-end request carrying the dashboard slug is not a dashboard request.
	 */
	public function test_is_dashboard_request_false_on_front_end() {
		set_current_screen( 'front' );
		$_GET['page'] = 'jetpack-premium-analytics';

		$this->assertFalse( Analytics::is_dashboard_request() );
	}
}
