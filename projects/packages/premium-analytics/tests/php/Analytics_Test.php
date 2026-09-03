<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Analytics class. Also covers ensure_widget_registry_ready(): only
 * test_rest_request_still_serves_the_widget_manifest exercises it, and php-code-coverage
 * discards lines outside declared @covers units — omitting it would mark the manifest require dead.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Analytics
 * @covers ::Automattic\Jetpack\PremiumAnalytics\ensure_widget_registry_ready
 */
#[CoversClass( Analytics::class )]
#[CoversFunction( 'Automattic\\Jetpack\\PremiumAnalytics\\ensure_widget_registry_ready' )]
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
	 * _doing_it_wrong() messages captured during a test, in the same order.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong_messages = array();

	/**
	 * Fail loudly if the fixture build leaked in from an earlier test.
	 *
	 * Because load_build() uses require_once, a second load is a no-op — without this check,
	 * dropping process isolation would silently pass every "does not load the build" assertion.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->assertNotContains(
			realpath( __DIR__ . '/fixtures/build-entry/build.php' ),
			array_map( 'realpath', get_included_files() ),
			'The fixture build leaked from an earlier test: process isolation is not working.'
		);

		unset( $GLOBALS['jpa_test_build_loaded'], $GLOBALS['jpa_test_interceptor_priority'] );
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
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'jetpack_stats_post_list_column_url' );
		remove_all_filters( 'rest_post_dispatch' );
		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );
		Constants::clear_constants();
		$this->reset_tracks_identity_state();
		Capabilities::unregister();
		$this->reset_analytics_init_state();
		parent::tearDown();
	}

	/**
	 * Drop the connected-user fixtures the Tracks identity tests set up.
	 */
	private function reset_tracks_identity_state() {
		$user_id = get_current_user_id();

		if ( $user_id ) {
			delete_transient( "jetpack_connected_user_data_$user_id" );
			\Jetpack_Options::delete_option( 'user_tokens' );
			wp_set_current_user( 0 );
		}
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
	 * Both init paths map the capability the admin menu and the dashboard routes
	 * are gated on. Nothing else hooks it for them, so without this the menu is
	 * registered with a capability nobody holds — including administrators.
	 *
	 * @param bool $wpcom_simple Whether to boot the WordPress.com Simple path.
	 * @dataProvider provide_init_entry_points
	 */
	#[DataProvider( 'provide_init_entry_points' )]
	public function test_init_maps_the_dashboard_capability( $wpcom_simple ) {
		$this->reset_analytics_init_state();

		if ( $wpcom_simple ) {
			Analytics::init_wpcom_simple();
		} else {
			Analytics::init();
		}

		$this->assertNotFalse(
			has_filter( 'map_meta_cap', array( Capabilities::class, 'map_meta_caps' ) )
		);
	}

	/**
	 * The post list table's views column links here once the dashboard boots.
	 *
	 * @param bool $wpcom_simple Whether to boot the WordPress.com Simple path.
	 * @dataProvider provide_init_entry_points
	 */
	#[DataProvider( 'provide_init_entry_points' )]
	public function test_init_claims_the_post_list_column_link( $wpcom_simple ) {
		$this->reset_analytics_init_state();

		if ( $wpcom_simple ) {
			Analytics::init_wpcom_simple();
		} else {
			Analytics::init();
		}

		$this->assertNotFalse(
			has_filter( 'jetpack_stats_post_list_column_url', array( Post_List_Link::class, 'filter_url' ) )
		);
	}

	/**
	 * The SPA path travels in `p`, encoded: the router reads that param and a raw
	 * `?` inside it would read as an outer query param instead.
	 */
	public function test_dashboard_url_carries_the_encoded_route_in_the_p_param() {
		$this->assertSame(
			admin_url( 'admin.php?page=' . self::MENU_SLUG . '&p=%2Fpost%2F123' ),
			Analytics::dashboard_url( '/post/123' )
		);

		$this->assertStringEndsWith(
			'&p=%2Fpost%2F123%3Fsection%3Dpost-traffic',
			Analytics::dashboard_url( '/post/123?section=post-traffic' )
		);

		// The router falls back to `/` for an absent or empty `p`, so the default
		// has to encode a route rather than drop the param.
		$this->assertSame(
			admin_url( 'admin.php?page=' . self::MENU_SLUG . '&p=%2F' ),
			Analytics::dashboard_url()
		);
	}

	/**
	 * The two platform entry points.
	 *
	 * @return array<string, array{bool}>
	 */
	public static function provide_init_entry_points() {
		return array(
			'connected site' => array( false ),
			'wpcom simple'   => array( true ),
		);
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
	 * Routes load lazily on rest_api_init via Dashboard_Support_Routes::boot_routes(), so this
	 * checks the hook is wired and that dispatching it actually registers the routes.
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
	 * With the rollout flag on, Analytics::init() runs on every request, and the
	 * build is admin render machinery a visitor never uses.
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
	 * The build's full-page interceptor is unhooked.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_full_page_interceptor_is_unhooked() {
		$this->use_fixture_build();
		set_current_screen( self::MENU_HOOKNAME );

		Analytics::init();
		do_action( 'init' );

		// Without this the assertion below passes on a fixture that never hooked the
		// interceptor, which is the state it is supposed to detect.
		$this->assertSame(
			10,
			$GLOBALS['jpa_test_interceptor_priority'] ?? null,
			'The fixture build did not hook the interceptor, so removing it proves nothing.'
		);
		$this->assertFalse(
			has_action( 'admin_init', 'jpa_jetpack_premium_analytics_intercept_render' ),
			'The wp-build full-page interceptor is still hooked, leaving ?page=jetpack-premium-analytics renderable wherever admin_init runs without Core\'s menu access check.'
		);
	}

	/**
	 * The admin-ajax.php endpoint sets is_admin() true but does not get the build.
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
	 * The admin-post.php endpoint sets is_admin() true the way admin-ajax does,
	 * and renders no dashboard either, so it does not get the build.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_post_request_does_not_load_the_build() {
		$this->use_fixture_build();
		set_current_screen( 'admin-post' );
		$GLOBALS['pagenow'] = 'admin-post.php';

		Analytics::init();
		do_action( 'init' );

		$this->assertArrayNotHasKey( 'jpa_test_build_loaded', $GLOBALS );
	}

	/**
	 * A REST request still gets the full widget manifest.
	 *
	 * Since is_admin() is false on REST, the build gate skips it there; the route and its lazy
	 * hydration come from boot_routes(). The fixture is staged via the manifest-path filter so
	 * the sentinel can only reach the registry through the require in
	 * ensure_widget_registry_ready() — delete that require (the #49961 outage) and this reddens.
	 *
	 * Asserts a uniquely named sentinel, not "response is not empty": the widget type registry
	 * is process-wide, so a non-empty response could be another test's leftovers.
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

		// The route's permission_callback is the dashboard capability; grant it by
		// filter rather than inserting a user, as the admin-menu tests do.
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );

		try {
			Analytics::init();
			do_action( 'init' );

			global $wp_rest_server;
			$wp_rest_server = new \WP_REST_Server();
			do_action( 'rest_api_init' );

			$response = $wp_rest_server->dispatch( new \WP_REST_Request( 'GET', '/wpcom/v2/widget-modules' ) );

			// Asserted separately so a permissions regression reads as one, not a missing sentinel:
			// array_column() over an error envelope is an empty list either way.
			$this->assertSame( 200, $response->get_status(), 'The manifest route must authorize the test user.' );
			$this->assertContains( 'test/rest-gate-sentinel', array_column( (array) $response->get_data(), 'name' ) );
		} finally {
			remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
			remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
			Widget_Type_Registry::get_instance()->unregister( 'test/rest-gate-sentinel' );
			unset( $GLOBALS['jpa_test_widget_manifest'] );
		}
	}

	/**
	 * Point the manifest require at the fixture manifest.
	 *
	 * @return string
	 */
	public function use_fixture_widget_manifest() {
		return __DIR__ . '/fixtures/build-entry/widgets.php';
	}

	/**
	 * Point the manifest at a missing file.
	 *
	 * @return string
	 */
	public function use_absent_widget_manifest() {
		return __DIR__ . '/fixtures/build-entry/no-such-widgets.php';
	}

	/**
	 * The wp-admin integrated dashboard slug in admin is recognized as a dashboard request.
	 */
	public function test_is_dashboard_request_true_for_wp_admin_slug() {
		set_current_screen( self::MENU_HOOKNAME );
		$_GET['page'] = self::MENU_SLUG;

		$this->assertTrue( Analytics::is_dashboard_request() );
	}

	/**
	 * The removed full-page slug is not a dashboard request.
	 */
	public function test_is_dashboard_request_false_for_full_page_slug() {
		set_current_screen( 'toplevel_page_jetpack-premium-analytics' );
		$_GET['page'] = 'jetpack-premium-analytics';

		$this->assertFalse( Analytics::is_dashboard_request() );
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
		$_GET['page'] = self::MENU_SLUG;

		$this->assertFalse( Analytics::is_dashboard_request() );
	}

	/**
	 * The menu is gated on the dashboard capability rather than manage_options, so a
	 * site that granted an editor view_stats keeps that editor's access to stats.
	 */
	public function test_register_admin_menu_uses_the_dashboard_capability() {
		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( Capabilities::VIEW_ANALYTICS, $menu_item[1] ?? null );
	}

	/**
	 * The `analytics` key's presence is what tells every Jetpack surface outside
	 * this package that this dashboard — not the legacy Stats page — is where
	 * analytics links should go.
	 */
	public function test_add_script_data_announces_the_dashboard() {
		$data = Analytics::add_script_data( array() );

		$this->assertTrue( $data['analytics']['enabled'] );
		$this->assertSame( Analytics::MENU_PAGE_SLUG, $data['analytics']['page_slug'] );
	}

	/**
	 * The published slug must be the slug the menu actually registers, or every
	 * link built from it 404s.
	 */
	public function test_add_script_data_publishes_the_registered_menu_slug() {
		$menu_item = $this->register_admin_menu_without_build();
		$data      = Analytics::add_script_data( array() );

		$this->assertSame( $menu_item[2] ?? null, $data['analytics']['page_slug'] );
	}

	/**
	 * The filter is shared, so the key must be added without disturbing anything
	 * another consumer already put there.
	 */
	public function test_add_script_data_preserves_existing_data() {
		$data = Analytics::add_script_data(
			array(
				'site'      => array( 'admin_url' => 'https://example.com/wp-admin/' ),
				'analytics' => array( 'stale' => true ),
			)
		);

		$this->assertSame( 'https://example.com/wp-admin/', $data['site']['admin_url'] );
		$this->assertArrayNotHasKey( 'stale', $data['analytics'] );
	}

	/**
	 * `can_view` answers the same question the menu's capability does, so a caller
	 * can hide a link rather than send someone to a screen they cannot open.
	 */
	public function test_add_script_data_reports_can_view_for_a_capable_user() {
		Capabilities::register();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );

		$data = Analytics::add_script_data( array() );

		remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		$this->assertTrue( $data['analytics']['can_view'] );
	}

	public function test_add_script_data_reports_can_view_false_without_the_capability() {
		Capabilities::register();

		$data = Analytics::add_script_data( array() );

		$this->assertFalse( $data['analytics']['can_view'] );
	}

	/**
	 * A named zone is preferred over a fixed offset: analytics links always point
	 * at past dates, so they cross daylight-saving boundaries routinely and a
	 * fixed offset would shift the day on the far side of a transition.
	 */
	public function test_add_script_data_prefers_the_timezone_string() {
		update_option( 'timezone_string', 'America/New_York' );
		update_option( 'gmt_offset', 5.5 );

		$data = Analytics::add_script_data( array() );

		$this->assertSame( 'America/New_York', $data['analytics']['timezone'] );
	}

	/**
	 * Sites configured with a raw UTC offset have no zone name to publish, so the
	 * offset is formatted the way the dashboard's own timezone resolver does.
	 *
	 * @param mixed  $offset   The `gmt_offset` option value.
	 * @param string $expected The expected published timezone.
	 * @dataProvider provide_gmt_offsets
	 */
	#[DataProvider( 'provide_gmt_offsets' )]
	public function test_add_script_data_falls_back_to_the_formatted_gmt_offset( $offset, $expected ) {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', $offset );

		$data = Analytics::add_script_data( array() );

		$this->assertSame( $expected, $data['analytics']['timezone'] );
	}

	/**
	 * @return array<string, array{mixed, string}>
	 */
	public static function provide_gmt_offsets() {
		return array(
			'UTC'                => array( 0, '+00:00' ),
			'whole hours east'   => array( 2, '+02:00' ),
			'whole hours west'   => array( -8, '-08:00' ),
			'half hour east'     => array( 5.5, '+05:30' ),
			'half hour west'     => array( -3.5, '-03:30' ),
			'three quarter hour' => array( 5.75, '+05:45' ),
			'double digit hours' => array( 13, '+13:00' ),
			'string option'      => array( '-5', '-05:00' ),
		);
	}

	/**
	 * With no caller override the label comes from the package itself, so nobody has
	 * to translate it before the textdomain can load.
	 */
	public function test_register_admin_menu_labels_the_page_from_the_package() {
		$menu_item = $this->register_admin_menu_without_build();

		$this->assertSame( 'Stats v2', $menu_item[0] ?? null );
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

		$this->assertSame( 'Stats v2', $menu_item[0] ?? null );
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
		$this->assertStringContainsString(
			'jpa_jetpack_premium_analytics_wp_admin_render_page',
			$this->doing_it_wrong_messages[0] ?? '',
			'The diagnostic must name the artifact that is actually missing.'
		);
		$this->assertStringNotContainsString(
			'build/widgets.php',
			$this->doing_it_wrong_messages[0] ?? '',
			'The manifest is staged here; naming it would send the reader to the wrong file.'
		);
	}

	/**
	 * A build that never ran names both artifacts in one diagnostic.
	 *
	 * Pins the whole sentence once, so the per-artifact tests can stay on substrings.
	 */
	public function test_register_admin_menu_lists_both_missing_artifacts() {
		$this->register_admin_menu_without_build( 'use_absent_widget_manifest' );

		$this->assertSame(
			array( Analytics::class . '::register_admin_menu' ),
			$this->doing_it_wrong,
			'Both artifacts are reported in one diagnostic, not one per artifact.'
		);
		$this->assertSame(
			'The Premium Analytics build output is incomplete: '
				. 'the jpa_jetpack_premium_analytics_wp_admin_render_page() callback, generated under build/pages/, '
				. 'build/widgets.php (the widget manifest). '
				. 'The package build did not run, or ran only partially, for this deploy.',
			$this->doing_it_wrong_messages[0] ?? ''
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
	 * With the build present, the menu wires the generated render callback.
	 *
	 * Unlike the missing-build tests, this covers the normal path, whose failure is quiet:
	 * the render function name is derived from the page slug at build time, so a rename on
	 * either side silently swaps the dashboard for the missing-build notice. Uses fixtures
	 * since the test suite generates no build artifacts.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_admin_menu_wires_the_generated_render_callback() {
		$this->use_fixture_build();
		set_current_screen( self::MENU_HOOKNAME );

		Analytics::init();

		$GLOBALS['menu'] = array();
		Capabilities::register();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		$this->capture_doing_it_wrong();
		Analytics::register_admin_menu();
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );

		$this->assertSame( array(), $this->doing_it_wrong, 'A present build must not report a missing one.' );
		$this->assertNotFalse(
			has_action( self::MENU_HOOKNAME, 'jpa_jetpack_premium_analytics_wp_admin_render_page' )
		);
	}

	/**
	 * A missing widget manifest is reported even when the page can render.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_admin_menu_reports_a_missing_widget_manifest() {
		$this->use_fixture_build();
		set_current_screen( self::MENU_HOOKNAME );

		Analytics::init();

		$GLOBALS['menu'] = array();
		Capabilities::register();
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		$this->capture_doing_it_wrong();
		Analytics::register_admin_menu();
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );

		$this->assertSame(
			array( Analytics::class . '::register_admin_menu' ),
			$this->doing_it_wrong,
			'A missing widget manifest must be reported even though the page renders.'
		);
		$this->assertStringContainsString(
			'build/widgets.php',
			$this->doing_it_wrong_messages[0] ?? '',
			'The diagnostic must name the artifact that is actually missing.'
		);
		$this->assertStringNotContainsString(
			'jpa_jetpack_premium_analytics_wp_admin_render_page',
			$this->doing_it_wrong_messages[0] ?? '',
			'The page renders here; naming its callback would send the reader to the wrong artifact.'
		);
		$this->assertNotFalse(
			has_action( self::MENU_HOOKNAME, 'jpa_jetpack_premium_analytics_wp_admin_render_page' ),
			'Only the manifest is missing, so the page still renders through the generated callback.'
		);
	}

	/**
	 * The unfiltered manifest path points at the generated build output.
	 *
	 * Every other test stages this path through the filter, so nothing else would notice the
	 * default breaking — on REST, a wrong path silently empties the widget registry (#49961).
	 */
	public function test_widget_manifest_path_defaults_to_the_generated_manifest() {
		// Collapse the ".." the default is built from rather than realpath()ing it:
		// build/ does not exist in a checkout that has not run the JS build.
		$path = preg_replace( '#/[^/]+/\.\./#', '/', Analytics::widget_manifest_path() );

		$this->assertSame( dirname( __DIR__, 2 ) . '/build/widgets.php', $path );
	}

	/**
	 * Point the build loader at the fixture build, which records that it ran.
	 */
	private function use_fixture_build() {
		$this->set_analytics_property( 'build_entry', __DIR__ . '/fixtures/build-entry/build.php' );
	}

	/**
	 * Register the admin menu from a clean menu global, with the generated render function absent
	 * — the state _doing_it_wrong() deliberately reports, captured here to avoid tripping the
	 * suite's warning gate. The capability grant lets add_menu_page() wire the render callback.
	 *
	 * @param string $manifest_filter Method on this class supplying the manifest path.
	 * @return array|null The registered menu entry.
	 */
	private function register_admin_menu_without_build( $manifest_filter = 'use_fixture_widget_manifest' ) {
		$GLOBALS['menu'] = array();

		// Hooked by boot_shared_services() in production; add_menu_page() resolves the
		// dashboard capability, and an unmapped one would skip the page's render hook.
		Capabilities::register();

		// Stage the manifest: unfiltered, the diagnostic would name a different set of
		// artifacts depending on whether this checkout has run the JS build.
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, $manifest_filter ) );
		add_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		$this->capture_doing_it_wrong();
		Analytics::register_admin_menu();
		remove_filter( 'user_has_cap', array( $this, 'grant_manage_options' ) );
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, $manifest_filter ) );

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
	 * Records each triggering function name and its message, and suppresses the
	 * underlying PHP warning, so a test can assert the diagnostic fired.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong          = array();
		$this->doing_it_wrong_messages = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name, $message ) {
				$this->doing_it_wrong[]          = $function_name;
				$this->doing_it_wrong_messages[] = $message;
			},
			10,
			2
		);
	}

	/**
	 * Give the (logged-out) test user what an administrator carries: manage_options,
	 * and the read primitive the dashboard capability maps to.
	 *
	 * @param array $caps Capabilities.
	 * @return array
	 */
	public function grant_manage_options( $caps ) {
		$caps['manage_options'] = true;
		$caps['read']           = true;

		return $caps;
	}

	/**
	 * A front-end request registers none of the admin render surface: no menu, no widget
	 * import map, no CSV export script data.
	 *
	 * Isolated because widget-modules.php and csv-exports.php register these filters at file
	 * scope via require_once, so an earlier test that loaded them would leave them registered
	 * here. Each assertion names its callback, not just the hook: Sync_Status_Tracker also
	 * filters jetpack_admin_js_script_data outside this gate, so a bare has_filter() there is
	 * true regardless.
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
		$this->assertFalse(
			has_filter(
				'jetpack_admin_js_script_data',
				__NAMESPACE__ . '\\inject_videopress_script_data'
			),
			'The VideoPress availability flag is not wired on a front-end request.'
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
		$this->assertNotFalse(
			has_filter(
				'jetpack_admin_js_script_data',
				__NAMESPACE__ . '\\inject_videopress_script_data'
			),
			'Simple still publishes the VideoPress availability flag.'
		);
	}

	/**
	 * Without the Tracks transport the dashboard's `@automattic/jetpack-analytics` events
	 * only pile up in `window._tkq`, so every feedback submission is silently lost.
	 */
	public function test_dashboard_enqueues_the_tracks_transport() {
		Analytics::enqueue_tracks_transport();

		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );

		wp_dequeue_script( 'jp-tracks' );
		wp_deregister_script( 'jp-tracks' );
	}

	/**
	 * The identity filter has to survive a site with no connected user: the dashboard
	 * still records events there, just anonymously.
	 */
	public function test_tracks_identity_is_left_alone_without_a_connected_user() {
		$data = array( 'user' => array( 'current_user' => array( 'id' => 1 ) ) );

		$this->assertSame( $data, Analytics::add_tracks_identity_script_data( $data ) );
	}

	/**
	 * On Simple the local user is the WPCOM user, so no connection lookup is involved.
	 */
	public function test_tracks_identity_names_the_local_user_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$user_id = self::sign_in_as( 'simple-user' );

		$data = Analytics::add_tracks_identity_script_data( array( 'user' => array( 'current_user' => array() ) ) );

		$this->assertSame(
			array(
				'ID'    => $user_id,
				'login' => 'simple-user',
			),
			$data['user']['current_user']['wpcom']
		);
	}

	/**
	 * Off Simple the identity comes from the connection, and carries only the two fields
	 * `identifyUser` needs: the rest of the connected-user payload is profile data.
	 */
	public function test_tracks_identity_names_the_connected_user_elsewhere() {
		$user_id = self::sign_in_as( 'local-user' );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => "dummy.usertoken.$user_id" ) );
		set_transient(
			"jetpack_connected_user_data_$user_id",
			array(
				'ID'    => 777,
				'login' => 'wpcomuser',
				'email' => 'wpcomuser@example.com',
			)
		);

		$data = Analytics::add_tracks_identity_script_data(
			array( 'user' => array( 'current_user' => array( 'wpcom' => array( 'colorScheme' => 'default' ) ) ) )
		);

		$this->assertSame(
			array(
				'colorScheme' => 'default',
				'ID'          => 777,
				'login'       => 'wpcomuser',
			),
			$data['user']['current_user']['wpcom']
		);
	}

	/**
	 * Create a user and make it the current one.
	 *
	 * @param string $login User login.
	 * @return int The new user's ID.
	 */
	private static function sign_in_as( $login ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}
}
