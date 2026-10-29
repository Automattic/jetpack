<?php
/**
 * Tests for the Protect dashboard.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use Automattic\Jetpack\Status\Cache;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Start from an empty menu queue, no sections and no init() options.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
		Dashboard::init();
		// init() registers the package's real sections; each test registers its own.
		self::reset_sections();
	}

	/**
	 * Leave no queued items or hooks behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		self::reset_sections();
		unset( $_GET['page'] );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'doing_it_wrong_run' );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_actions( 'add_option_' . Scan_Status::OPTION_NAME );
		remove_all_actions( 'update_option_' . Scan_Status::OPTION_NAME );
		delete_option( Scan_Status::OPTION_NAME );
		delete_option( Dashboard_Threats::RESOLVED_OPTION );
		wp_dequeue_script( 'jp-tracks' );
		wp_deregister_script( 'jp-tracks' );
		\Jetpack_Options::delete_option( array( 'tos_agreed', 'blog_token', 'user_tokens' ) );
		wp_set_current_user( 0 );
		Cache::clear();
		foreach ( array_keys( Dashboard::MODULE_SECTIONS ) as $module ) {
			remove_all_filters( Dashboard::CONFIGURATION_URL_FILTER . $module );
			remove_all_filters( 'jetpack_module_configurable_' . $module );
		}
		foreach ( array( 'jetpack_page_', 'admin_page_' ) as $prefix ) {
			remove_all_actions( 'load-' . $prefix . Dashboard::MENU_SLUG );
			remove_all_actions( 'load-' . $prefix . Dashboard::MENU_SLUG . '-network' );
		}
		parent::tear_down();
	}

	/**
	 * Empty the private section registry.
	 */
	private static function reset_sections() {
		$sections = new \ReflectionProperty( Dashboard::class, 'sections' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$sections->setAccessible( true );
		}
		$sections->setValue( null, array() );
	}

	/**
	 * Record _doing_it_wrong() calls instead of raising them.
	 *
	 * @return \ArrayObject The names of the functions called wrongly, filled as calls happen.
	 */
	private function capture_doing_it_wrong() {
		$calls = new \ArrayObject();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) use ( $calls ) {
				$calls[] = $function_name;
			}
		);
		return $calls;
	}

	/**
	 * Build a section double.
	 *
	 * @param string $key            Section key.
	 * @param array  $state          Section state.
	 * @param bool   $expects_routes Whether the section must be asked for its routes once.
	 * @return Dashboard_Section
	 */
	private function make_section( $key, $state, $expects_routes = false ) {
		$section = $expects_routes
			? $this->createMock( Dashboard_Section::class )
			: $this->createStub( Dashboard_Section::class );
		$section->method( 'get_key' )->willReturn( $key );
		$section->method( 'get_state' )->willReturn( $state );
		if ( $expects_routes ) {
			$section->expects( $this->once() )->method( 'register_routes' );
		}
		return $section;
	}

	/**
	 * Queue an item on the Protect slug, as the Jetpack Protect plugin does.
	 */
	private function register_plugin_item() {
		Admin_Menu::add_menu( 'Protect', 'Protect', 'manage_options', Dashboard::MENU_SLUG, '__return_null' );
	}

	/**
	 * How many items are already queued on the Protect slug.
	 *
	 * @return array[]
	 */
	public static function provide_registered_item_counts() {
		return array(
			'nothing registered'        => array( 0 ),
			'the slug registered twice' => array( 2 ),
		);
	}

	/**
	 * @dataProvider provide_registered_item_counts
	 *
	 * @param int $registered Items already queued on the Protect slug.
	 */
	#[DataProvider( 'provide_registered_item_counts' )]
	public function test_add_menu_leaves_one_item_that_renders_the_dashboard( $registered ) {
		for ( $i = 0; $i < $registered; $i++ ) {
			$this->register_plugin_item();
		}

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertIsArray( $item );
		$this->assertSame( array( Dashboard::class, 'render' ), $item['function'] );
		$this->assertFalse( Admin_Menu::remove_menu( Dashboard::MENU_SLUG ) );
	}

	/**
	 * Each security module and the card its Configure link should open.
	 *
	 * @return array[]
	 */
	public static function provide_security_modules() {
		return array(
			'Firewall'            => array( 'waf', 'firewall' ),
			'Brute force'         => array( 'protect', 'loginProtection' ),
			'Account protection'  => array( 'account-protection', 'loginProtection' ),
			'WordPress.com login' => array( 'sso', 'loginProtection' ),
			'Downtime monitoring' => array( 'monitor', 'monitor' ),
		);
	}

	/**
	 * @dataProvider provide_security_modules
	 *
	 * @param string $module  Module slug.
	 * @param string $section The section whose card should open.
	 */
	#[DataProvider( 'provide_security_modules' )]
	public function test_security_module_configure_links_open_their_settings_card( $module, $section ) {
		$this->assertSame(
			admin_url( 'admin.php?page=jetpack-protect&p=%2F%3Ftab%3Dsettings%26section%3D' . $section ),
			apply_filters( 'jetpack_module_configuration_url_' . $module, 'https://example.com/default' )
		);
		$this->assertTrue( apply_filters( 'jetpack_module_configurable_' . $module, false ) );
	}

	/**
	 * The URL a host sends and the upgrade link that results (null for the default).
	 *
	 * @return array[]
	 */
	public static function provide_host_upgrade_urls() {
		return array(
			'host plans'      => array( 'https://example.com/plans', 'https://example.com/plans' ),
			'javascript: URL' => array( 'javascript:alert(1)', null ),
			'not an array'    => array( null, null ),
		);
	}

	/**
	 * @dataProvider provide_host_upgrade_urls
	 *
	 * @param string|null $url      The URL the host sends, or null to return a non-array.
	 * @param string|null $expected The resulting link, or null for the unfiltered one.
	 */
	#[DataProvider( 'provide_host_upgrade_urls' )]
	public function test_host_can_send_scan_upgrade_elsewhere( $url, $expected ) {
		$default      = Dashboard::get_scan_upgrade_url();
		$send_to_host = static function ( $upgrade, $slug ) use ( $url ) {
			if ( null === $url ) {
				return '';
			}
			return 'protect-dashboard' === $slug ? array_merge( $upgrade, array( 'url' => $url ) ) : $upgrade;
		};
		add_filter( 'jetpack_feature_upgrade', $send_to_host, 10, 2 );

		$link = Dashboard::get_scan_upgrade_url();
		remove_filter( 'jetpack_feature_upgrade', $send_to_host, 10 );

		$this->assertSame( $expected ?? $default, $link );
	}

	public function test_init_announces_the_dashboard() {
		$this->assertGreaterThan( 0, did_action( 'jetpack_protect_dashboard_initialized' ) );
	}

	public function test_add_menu_runs_before_admin_menu_registers_its_items() {
		$priority = has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) );
		$this->assertIsInt( $priority );
		$this->assertLessThan( 1000, $priority );
	}

	public function test_add_menu_passes_the_init_options_to_the_item() {
		Dashboard::init( array( 'module' => 'protect-dashboard' ) );

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertSame( 'protect-dashboard', $item['args']['module'] );
	}

	/**
	 * Both names core can give the page.
	 *
	 * @return array[]
	 */
	public static function provide_load_hooks() {
		return array(
			array( 'load-jetpack_page_' . Dashboard::MENU_SLUG ),
			array( 'load-admin_page_' . Dashboard::MENU_SLUG ),
		);
	}

	/**
	 * @dataProvider provide_load_hooks
	 *
	 * @param string $hook The page's load hook.
	 */
	#[DataProvider( 'provide_load_hooks' )]
	public function test_add_menu_drops_the_callbacks_already_on_the_load_hook( $hook ) {
		$this->register_plugin_item();
		add_action( $hook, '__return_null' );

		Dashboard::add_menu();

		$this->assertFalse( has_action( $hook, '__return_null' ) );
		// Admin_Menu::add_menu() puts its own callback back for the new item.
		$this->assertNotFalse( has_action( $hook, array( Admin_Menu::class, 'hide_core_admin_notices' ) ) );
	}

	public function test_render_says_so_when_the_build_is_missing() {
		if ( function_exists( Dashboard::RENDER_FUNCTION ) ) {
			$this->markTestSkipped( 'Needs the wp-build output not to be loaded.' );
		}

		ob_start();
		Dashboard::render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'could not be loaded because its assets are missing', $output );
	}

	/**
	 * Build indexes that can't render the page.
	 *
	 * @return array[]
	 */
	public static function provide_unusable_builds() {
		return array(
			'no build'    => array( __DIR__ . '/fixtures/missing-build.php' ),
			'stale build' => array( __DIR__ . '/fixtures/stale-build.php' ),
		);
	}

	/**
	 * @dataProvider provide_unusable_builds
	 *
	 * @param string $build_index Path to the build index.
	 */
	#[DataProvider( 'provide_unusable_builds' )]
	public function test_load_wp_build_leaves_core_scripts_alone_without_a_usable_build( $build_index ) {
		$this->assertFalse( Dashboard::load_wp_build( $build_index ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Dashboard::class, 'enqueue_i18n_loader' ) ) );
		$this->assertNotContains( 'jetpack-protect', array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) ) );
	}

	/**
	 * Requested `page` values and whether each is the dashboard's.
	 *
	 * @return array[]
	 */
	public static function provide_page_requests() {
		return array(
			'the Protect page' => array( Dashboard::MENU_SLUG, true ),
			'another page'     => array( 'jetpack', false ),
			'no page'          => array( null, false ),
		);
	}

	/**
	 * @dataProvider provide_page_requests
	 *
	 * @param string|null $page     The requested `page`, or null for none.
	 * @param bool        $expected Whether the request is for the dashboard.
	 */
	#[DataProvider( 'provide_page_requests' )]
	public function test_is_dashboard_request_matches_only_the_protect_page( $page, $expected ) {
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}

		$this->assertSame( $expected, Dashboard::is_dashboard_request() );
	}

	/**
	 * Threat report requests and the dashboard URL each should redirect to.
	 *
	 * @return array[]
	 */
	public static function provide_threat_report_requests() {
		$report = admin_url( 'admin.php?page=jetpack-protect&p=%2F%3Fthreats%3D' );
		return array(
			'ids'                   => array( array( 'threats' => '12,34' ), $report . '12%2C34' ),
			'ids with junk dropped' => array( array( 'threats' => '12, 3<4,x, 56' ), $report . '12%2C56' ),
			'no ids left'           => array( array( 'threats' => 'abc' ), null ),
			'no threats param'      => array( array(), null ),
			'an array'              => array( array( 'threats' => array( '12' ) ), null ),
			'already routed'        => array(
				array(
					'threats' => '12',
					'p'       => '/',
				),
				null,
			),
		);
	}

	/**
	 * @dataProvider provide_threat_report_requests
	 *
	 * @param array       $query    The request's query args.
	 * @param string|null $expected The redirect, or null for none.
	 */
	#[DataProvider( 'provide_threat_report_requests' )]
	public function test_get_threat_report_redirect_moves_the_ids_into_the_route( $query, $expected ) {
		$this->assertSame( $expected, Dashboard::get_threat_report_redirect( $query ) );
	}

	public function test_restore_screen_id_undoes_the_alias() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'jetpack_page_jetpack-protect' );

		Dashboard::alias_screen_id();
		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, get_current_screen()->id );

		Dashboard::restore_screen_id();
		$this->assertSame( 'jetpack_page_jetpack-protect', get_current_screen()->id );
	}

	/**
	 * Test that a second section with a registered key is refused.
	 */
	public function test_register_section_keeps_the_first_section_for_a_key() {
		$doing_it_wrong = $this->capture_doing_it_wrong();

		Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'first' ) ) );
		Dashboard::register_section( $this->make_section( 'scan', array( 'order' => 'second' ) ) );

		$this->assertSame( array( 'scan' => array( 'order' => 'first' ) ), Dashboard::get_initial_state() );
		$this->assertSame( array( Dashboard::class . '::register_section' ), $doing_it_wrong->getArrayCopy() );
	}

	/**
	 * Test that every section contributes its state and its REST routes.
	 */
	public function test_sections_provide_state_by_key_and_register_routes() {
		$scan    = $this->make_section( 'scan', array( 'threats' => 2 ), true );
		$monitor = $this->make_section( 'monitor', array( 'active' => true ), true );

		Dashboard::register_section( $scan );
		Dashboard::register_section( $monitor );
		Dashboard::register_rest_routes();

		$this->assertSame(
			array(
				'scan'    => array( 'threats' => 2 ),
				'monitor' => array( 'active' => true ),
			),
			Dashboard::get_initial_state()
		);
	}

	/**
	 * Test that a section file's class is found by its file name, and registered once however often init() runs.
	 */
	public function test_load_sections_registers_each_file_class_once() {
		$dir            = __DIR__ . '/fixtures/sections';
		$doing_it_wrong = $this->capture_doing_it_wrong();

		Dashboard::load_sections( $dir );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Loading twice is the behavior under test.
		Dashboard::load_sections( $dir );

		$this->assertSame( array( 'example' => array( 'loaded' => true ) ), Dashboard::get_initial_state() );
		$this->assertCount( 0, $doing_it_wrong );
	}

	/**
	 * Section states, and the script that prints them.
	 *
	 * @return array[]
	 */
	public static function provide_initial_states() {
		return array(
			'no sections'            => array( null, 'window.jetpackProtectDashboard = {};' ),
			'state closing a script' => array( array( 'title' => '</script>' ), 'window.jetpackProtectDashboard = {"scan":{"title":"\\u003C/script\\u003E"}};' ),
		);
	}

	/**
	 * @dataProvider provide_initial_states
	 *
	 * @param array|null $state    The scan section's state, or null for no section.
	 * @param string     $expected The printed script.
	 */
	#[DataProvider( 'provide_initial_states' )]
	public function test_print_initial_state_prints_an_escaped_object( $state, $expected ) {
		if ( null !== $state ) {
			Dashboard::register_section( $this->make_section( 'scan', $state ) );
		}

		ob_start();
		Dashboard::print_initial_state();
		$output = ob_get_clean();

		$this->assertStringContainsString( $expected, $output );
	}

	/**
	 * Whether the site agreed to the terms, whether it is offline, and whether Tracks is allowed.
	 *
	 * @return array[]
	 */
	public static function provide_tracking_states() {
		return array(
			'terms agreed'     => array( true, false, true ),
			'offline'          => array( true, true, false ),
			'terms not agreed' => array( false, false, false ),
		);
	}

	/**
	 * @dataProvider provide_tracking_states
	 *
	 * @param bool $agreed   Whether the site agreed to the terms of service.
	 * @param bool $offline  Whether Jetpack is in offline mode.
	 * @param bool $expected Whether the Tracks script loads and the page may record.
	 */
	#[DataProvider( 'provide_tracking_states' )]
	public function test_tracks_loads_only_when_tracking_is_allowed( $agreed, $offline, $expected ) {
		\Jetpack_Options::update_option( 'tos_agreed', $agreed );
		add_filter( 'jetpack_offline_mode', $offline ? '__return_true' : '__return_false' );

		Dashboard::enqueue_tracks_transport();
		ob_start();
		Dashboard::print_tracks_state();
		$printed = ob_get_clean();

		$this->assertSame( $expected, wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertSame( $expected, false !== strpos( $printed, 'window.jetpackProtectTracks = true;' ) );
	}

	/**
	 * Whether the current user is connected, the WordPress.com user already in the script data, and the result.
	 *
	 * @return array[]
	 */
	public static function provide_tracks_identities() {
		$set_by_another_package = array(
			'ID'    => 5,
			'login' => 'other',
		);
		return array(
			'already set by another package' => array( true, $set_by_another_package, $set_by_another_package ),
			'no connected user'              => array( false, array( 'avatar' => 'a.png' ), array( 'avatar' => 'a.png' ) ),
			'connected user'                 => array(
				true,
				array( 'avatar' => 'a.png' ),
				array(
					'avatar' => 'a.png',
					'ID'     => 7,
					'login'  => 'wpcomuser',
				),
			),
		);
	}

	/**
	 * @dataProvider provide_tracks_identities
	 *
	 * @param bool  $connected Whether the current user is connected to WordPress.com.
	 * @param array $wpcom     The WordPress.com user already in the script data.
	 * @param array $expected  The WordPress.com user in the returned script data.
	 */
	#[DataProvider( 'provide_tracks_identities' )]
	public function test_add_tracks_identity_fills_in_only_a_missing_user( $connected, $wpcom, $expected ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		if ( $connected ) {
			\Jetpack_Options::update_option( 'blog_token', 'blog.secret' );
			\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
			set_transient(
				"jetpack_connected_user_data_$user_id",
				array(
					'ID'    => 7,
					'login' => 'wpcomuser',
				)
			);
		}

		$data = Dashboard::add_tracks_identity( array( 'user' => array( 'current_user' => array( 'wpcom' => $wpcom ) ) ) );

		$this->assertSame( $expected, $data['user']['current_user']['wpcom'] );
	}

	/**
	 * Whether a scan stored after the fix failed, and which fixes stay recorded.
	 *
	 * @return array[]
	 */
	public static function provide_stored_scans() {
		return array(
			'a completed scan clears the fix' => array( false, array() ),
			'a failed scan keeps it'          => array( true, array( '1' ) ),
		);
	}

	/**
	 * Test that storing a completed scan clears the fixes it answers for, even before anything reads it.
	 *
	 * @dataProvider provide_stored_scans
	 *
	 * @param bool     $failed   Whether the stored scan failed.
	 * @param string[] $expected Ids still recorded.
	 */
	#[DataProvider( 'provide_stored_scans' )]
	public function test_storing_a_scan_prunes_recorded_fixes( $failed, $expected ) {
		Dashboard_Threats::resolve( array( 'id' => '1' ) );
		$scan = (object) array(
			'most_recent' => (object) array(
				'timestamp' => gmdate( 'c', time() + HOUR_IN_SECONDS ),
				'error'     => $failed,
			),
		);

		Scan_Status::update_status_option( $scan );

		$this->assertSame( $expected, array_map( 'strval', array_keys( Dashboard_Threats::get_resolved() ) ) );
	}
}
