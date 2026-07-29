<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
	 * Clear the fixture build's marker. Process isolation should make this
	 * unnecessary, but if isolation ever stops working this turns a silent
	 * wrong-answer into a plain assertion failure.
	 */
	protected function setUp(): void {
		parent::setUp();
		unset( $GLOBALS['jpa_test_build_loaded'] );
	}

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
		$this->set_analytics_property( 'build_entry', null );
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
	 * A plain front-end page view never reaches the wp-build output.
	 *
	 * This is the regression the gate exists for: with the rollout flag on,
	 * Analytics::init() runs on every request, and the build is admin render
	 * machinery — 170 files and 74 widgets' worth of script-module registration
	 * that a visitor never uses.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_front_end_request_does_not_load_the_build() {
		$this->use_fixture_build();

		Analytics::init();
		do_action( 'init' );

		$this->assertArrayNotHasKey( 'jpa_test_build_loaded', $GLOBALS );
	}

	/**
	 * A wp-admin request still loads the build, which is what renders the page.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_request_loads_the_build() {
		$this->use_fixture_build();
		set_current_screen( 'toplevel_page_jetpack-premium-analytics-wp-admin' );

		Analytics::init();
		do_action( 'init' );

		$this->assertArrayHasKey( 'jpa_test_build_loaded', $GLOBALS );
	}

	/**
	 * The admin-ajax.php endpoint sets is_admin() true, but that traffic is mostly
	 * front-end in origin — WooCommerce stores especially. It renders no dashboard,
	 * and the package registers no wp_ajax handlers, so it does not need the build.
	 *
	 * Defining DOING_AJAX is safe here only because the test runs in its own
	 * process; a constant cannot be unset.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_ajax_request_does_not_load_the_build() {
		$this->use_fixture_build();
		set_current_screen( 'admin-ajax' );
		define( 'DOING_AJAX', true );

		Analytics::init();
		do_action( 'init' );

		$this->assertArrayNotHasKey( 'jpa_test_build_loaded', $GLOBALS );
	}

	/**
	 * A REST request still gets the full widget manifest.
	 *
	 * Because is_admin() is false on REST, the gate skips the build there. This
	 * test pins the half a unit test can reach: the route is still registered and
	 * the lazy hydration path still runs, both via
	 * Dashboard_Support_Routes::boot_routes() on rest_api_init.
	 *
	 * The sentinel only reaches the registry through the manifest require in
	 * ensure_widget_registry_ready(), because the test stages the fixture through
	 * widgets_manifest_path() rather than declaring
	 * jpa_get_registered_widget_modules() up front. Deleting that require — the
	 * #49961 outage — reddens this test.
	 *
	 * Asserts a uniquely named sentinel rather than "the response is not empty":
	 * the widget type registry is process-wide, so a non-empty response could be
	 * another test's leftovers. Isolation keeps the registry and
	 * ensure_widget_registry_ready()'s static memo clean.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_rest_request_still_serves_the_widget_manifest() {
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => 'test/rest-gate-sentinel',
				'render_module' => 'test/rest-gate/render',
				'widget_module' => 'test/rest-gate/widget',
			),
		);

		// The route's permission_callback is manage_options; grant it by filter
		// rather than inserting a user, as the admin-menu tests do.
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );

		try {
			Analytics::init();
			do_action( 'init' );

			global $wp_rest_server;
			$wp_rest_server = new \WP_REST_Server();
			do_action( 'rest_api_init' );

			// Staged here, not before init(): boot_routes() is what loads
			// widget-modules.php on REST, so the seam only exists once it has run.
			// The route callback hydrates the registry later, at dispatch.
			widgets_manifest_path( __DIR__ . '/fixtures/build-entry/widgets.php' );

			$response = $wp_rest_server->dispatch( new \WP_REST_Request( 'GET', '/wpcom/v2/widget-modules' ) );

			// Asserted separately so a permissions regression reads as one, rather
			// than as a missing sentinel: array_column() over an error envelope is
			// an empty list either way.
			$this->assertSame( 200, $response->get_status(), 'The manifest route must authorize the test user.' );
			$this->assertContains( 'test/rest-gate-sentinel', array_column( (array) $response->get_data(), 'name' ) );
		} finally {
			remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
			Widget_Type_Registry::get_instance()->unregister( 'test/rest-gate-sentinel' );
			unset( $GLOBALS['jpa_test_widget_manifest'] );
		}
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
	 * Point the build loader at the fixture build, which records that it ran.
	 */
	private function use_fixture_build() {
		$this->set_analytics_property( 'build_entry', __DIR__ . '/fixtures/build-entry/build.php' );
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

	/**
	 * A front-end request registers none of the admin render surface: no menu,
	 * no widget import map, no CSV export script data.
	 *
	 * Isolated because the filters being asserted are registered at file scope
	 * by widget-modules.php and csv-exports.php, and require_once means an
	 * earlier test that loaded them would leave them registered for this one.
	 *
	 * Each assertion names its callback rather than just the hook.
	 * Sync_Status_Tracker also filters jetpack_admin_js_script_data, and it
	 * stays outside the gate, so a bare has_filter() on that hook is true on a
	 * front-end request no matter what this gate does.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_front_end_request_registers_no_admin_surface() {
		Analytics::init();

		$this->assertFalse(
			has_action( 'admin_menu', array( Analytics::class, 'register_admin_menu' ) ),
			'The admin menu is not registered on a front-end request.'
		);
		$this->assertFalse(
			has_filter(
				'jetpack-premium-analytics-wp-admin_boot_dependencies',
				__NAMESPACE__ . '\\add_widget_modules_to_boot_deps'
			),
			'The widget import map is not wired on a front-end request.'
		);
		$this->assertFalse(
			has_filter(
				'jetpack_admin_js_script_data',
				__NAMESPACE__ . '\\inject_csv_exports_script_data'
			),
			'The CSV export script data is not wired on a front-end request.'
		);
	}

	/**
	 * WordPress.com Simple gets the same treatment: no build on a front-end
	 * request. Simple boots this package on every request across WPCOM's
	 * public-api process, so this is where the saving is largest.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_front_end_request_does_not_load_the_build() {
		$this->use_fixture_build();

		Analytics::init_wpcom_simple();
		do_action( 'init' );

		$this->assertArrayNotHasKey( 'jpa_test_build_loaded', $GLOBALS );
	}

	/**
	 * Simple's wp-admin dashboard is unchanged: build, menu, import map, and CSV
	 * export script data all still register.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_admin_request_keeps_the_dashboard() {
		$this->use_fixture_build();
		set_current_screen( 'toplevel_page_jetpack-premium-analytics-wp-admin' );

		Analytics::init_wpcom_simple();
		do_action( 'init' );

		$this->assertArrayHasKey( 'jpa_test_build_loaded', $GLOBALS, 'Simple still loads the build in wp-admin.' );
		$this->assertNotFalse(
			has_action( 'admin_menu', array( Analytics::class, 'register_admin_menu' ) ),
			'Simple still registers the admin menu.'
		);
		$this->assertNotFalse(
			has_filter(
				'jetpack-premium-analytics-wp-admin_boot_dependencies',
				__NAMESPACE__ . '\\add_widget_modules_to_boot_deps'
			),
			'Simple still wires the widget import map.'
		);
		$this->assertNotFalse(
			has_filter(
				'jetpack_admin_js_script_data',
				__NAMESPACE__ . '\\inject_csv_exports_script_data'
			),
			'Simple still wires the CSV export script data.'
		);
	}
}
