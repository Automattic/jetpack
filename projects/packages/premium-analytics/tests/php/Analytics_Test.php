<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Analytics class.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Analytics
 */
#[CoversClass( Analytics::class )]
class Analytics_Test extends TestCase {

	const MENU_SLUG     = 'jetpack-premium-analytics-wp-admin';
	const MENU_HOOKNAME = 'toplevel_page_' . self::MENU_SLUG;

	/**
	 * _doing_it_wrong() function names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Reset request and screen globals touched by the dashboard-request tests.
	 */
	protected function tearDown(): void {
		unset( $_GET['page'] );
		unset( $GLOBALS['current_screen'] );
		unset( $GLOBALS['menu'] );
		remove_all_actions( self::MENU_HOOKNAME );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
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
	 * Reset the one-shot init guard and the caller-supplied menu label between tests.
	 */
	private function reset_analytics_init_state() {
		$this->set_analytics_property( 'initialized', false );
		$this->set_analytics_property( 'menu_title', null );
		$this->set_analytics_property( 'resolved_menu_title', null );
	}

	/**
	 * Set one of the class's private statics.
	 *
	 * @param string $name  Property name.
	 * @param mixed  $value Value to set.
	 */
	private function set_analytics_property( $name, $value ) {
		$property = new \ReflectionProperty( Analytics::class, $name );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
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

	/**
	 * With no caller override the label comes from the package itself, so nobody has
	 * to translate it before the textdomain can load.
	 */
	public function test_register_admin_menu_labels_the_page_from_the_package() {
		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( 'Analytics', $menu_item[0] ?? null );
	}

	/**
	 * A caller-supplied label wins over the package default.
	 */
	public function test_register_admin_menu_honors_a_caller_label() {
		Analytics::init( array( 'menu_title' => 'Store Analytics' ) );

		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( 'Store Analytics', $menu_item[0] ?? null );
	}

	/**
	 * A caller that needs its own textdomain passes a closure, which we resolve here
	 * rather than at init time.
	 */
	public function test_register_admin_menu_resolves_a_caller_label_closure() {
		$calls = 0;
		Analytics::init(
			array(
				'menu_title' => function () use ( &$calls ) {
					++$calls;

					return 'Store Analytics';
				},
			)
		);

		$this->assertSame( 0, $calls, 'The label closure must not run at init time.' );

		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( 'Store Analytics', $menu_item[0] ?? null );
		$this->assertSame( 1, $calls );
	}

	/**
	 * Values a caller's closure might hand back instead of a usable label.
	 *
	 * @return array<string, array{mixed}>
	 */
	public static function data_unusable_closure_labels() {
		return array(
			'null'         => array( null ),
			'empty string' => array( '' ),
			'not a string' => array( 42 ),
		);
	}

	/**
	 * A closure that returns nothing usable leaves the menu labelled rather than blank.
	 *
	 * @dataProvider data_unusable_closure_labels
	 *
	 * @param mixed $returned What the caller's closure hands back.
	 */
	#[DataProvider( 'data_unusable_closure_labels' )]
	public function test_register_admin_menu_falls_back_when_a_closure_returns_no_label( $returned ) {
		Analytics::init(
			array(
				'menu_title' => function () use ( $returned ) {
					return $returned;
				},
			)
		);

		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( 'Analytics', $menu_item[0] ?? null );
	}

	/**
	 * The label is resolved once, so an unstable closure can't leave the menu and the
	 * page heading disagreeing with each other.
	 */
	public function test_menu_label_is_resolved_once_per_request() {
		$calls = 0;
		Analytics::init(
			array(
				'menu_title' => function () use ( &$calls ) {
					++$calls;

					return 'Analytics ' . $calls;
				},
			)
		);

		$menu_item = $this->register_admin_menu_without_build();

		ob_start();
		Analytics::render_missing_build_notice();
		$output = ob_get_clean();

		$this->assertSame( 1, $calls );
		$this->assertSame( 'Analytics 1', $menu_item[0] ?? null );
		$this->assertStringContainsString( '<h1>Analytics 1</h1>', $output );
	}

	/**
	 * A missing build is reported on the admin request that registers the menu, not
	 * only when someone opens the dashboard.
	 */
	public function test_register_admin_menu_reports_a_missing_build() {
		$this->register_admin_menu_without_build();

		$this->assertSame(
			array( Analytics::class . '::register_admin_menu' ),
			$this->doing_it_wrong
		);
	}

	/**
	 * Without the generated render function the page falls back to the notice rather
	 * than the blank screen __return_null used to leave behind.
	 */
	public function test_register_admin_menu_falls_back_to_the_missing_build_notice() {
		$this->register_admin_menu_without_build();

		$this->assertNotFalse(
			has_action(
				self::MENU_HOOKNAME,
				array( Analytics::class, 'render_missing_build_notice' )
			)
		);
	}

	/**
	 * The missing-build page explains itself, under the same label as the menu.
	 */
	public function test_missing_build_notice_explains_itself_under_the_menu_label() {
		Analytics::init( array( 'menu_title' => 'Store Analytics' ) );

		ob_start();
		Analytics::render_missing_build_notice();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<h1>Store Analytics</h1>', $output );
		$this->assertStringContainsString( 'The package build did not run for this deploy.', $output );
	}

	/**
	 * Register the admin menu from a clean menu global, with the generated render
	 * function absent - the state _doing_it_wrong() deliberately reports, so the
	 * call is captured rather than left to trip the suite's warning gate.
	 * add_menu_page() only wires the render callback for a user who can reach the
	 * page, hence the capability grant.
	 *
	 * @return array|null The registered menu entry.
	 */
	private function register_admin_menu_without_build() {
		$GLOBALS['menu'] = array();

		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		$this->capture_doing_it_wrong();
		Analytics::register_admin_menu();
		remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );

		foreach ( $GLOBALS['menu'] as $item ) {
			if ( self::MENU_SLUG === ( $item[2] ?? null ) ) {
				return $item;
			}
		}

		return null;
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * Records each triggering function name in $this->doing_it_wrong and suppresses the
	 * underlying PHP warning, so a test can assert the diagnostic fired.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
	}

	/**
	 * Grant manage_options to the (logged-out) test user.
	 *
	 * @param array $caps Capabilities.
	 * @return array
	 */
	public function grant_manage_options( $caps ) {
		$caps['manage_options'] = true;

		return $caps;
	}
}
