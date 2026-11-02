<?php
/**
 * Tests for the shared wp-build page base.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Backup;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'tests/lib/class-test-wp-build-page.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Tests for the shared wp-build page base.
 */
class WPCOM_WP_Build_Page_Test extends \WorDBless\BaseTestCase {

	/**
	 * Screen ID wp-admin gives the test page, from its parent and menu slug.
	 */
	const SCREEN_ID = 'jetpack_page_jetpack-test-page';

	/**
	 * A fake build directory, removed after each test.
	 *
	 * @var string
	 */
	private $build_dir;

	/**
	 * Point the test page at a fake build holding a route registry.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->build_dir = get_temp_dir() . 'wpcom-wp-build-page-' . wp_generate_password( 8, false );
		mkdir( $this->build_dir . '/routes', 0777, true );
		file_put_contents( $this->build_dir . '/build.php', '<?php' );
		file_put_contents(
			$this->build_dir . '/routes/registry.php',
			'<?php return ' . var_export( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
				array(
					array(
						'name' => 'test-page',
						'page' => 'test-page',
					),
					array(
						'name' => 'test-page-settings',
						'page' => 'test-page',
					),
					array(
						'name' => 'other',
						'page' => 'other-page',
					),
				),
				true
			) . ';'
		);
		Test_WP_Build_Page::$build_dir = $this->build_dir;
	}

	/**
	 * Leave the admin globals, page state and filesystem as they were found.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset(
			$GLOBALS['current_screen'],
			$GLOBALS['pagenow'],
			$GLOBALS['plugin_page'],
			$_GET['page']
		);
		remove_all_actions( 'admin_menu', Test_WP_Build_Page::REGISTER_PRIORITY );
		Test_WP_Build_Page::$build_dir     = null;
		Test_WP_Build_Page::$initial_state = array( 'enabled' => true );
		Test_WP_Build_Page::reset();
		WPCOM_Backup::reset();

		foreach ( array( '/routes/registry.php', '/build.php' ) as $file ) {
			wp_delete_file( $this->build_dir . $file );
		}
		rmdir( $this->build_dir . '/routes' );
		rmdir( $this->build_dir );

		parent::tear_down();
	}

	/**
	 * Put an administrator on a clean admin menu with the Jetpack parent present.
	 *
	 * @return void
	 */
	private function set_up_admin_menu() {
		$GLOBALS['menu']              = array();
		$GLOBALS['submenu']           = array();
		$GLOBALS['admin_page_hooks']  = array();
		$GLOBALS['_registered_pages'] = array();
		$GLOBALS['_parent_pages']     = array();
		$GLOBALS['parent_file']       = '';
		unset( $_GET['page'] );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_wp_build_page_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);

		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );
	}

	/**
	 * Put the request on the test page, the way wp-admin/admin.php would.
	 *
	 * Built with WP_Screen::get() rather than set_current_screen(), which would fire
	 * `current_screen` and run other features' callbacks in this shared suite.
	 *
	 * @return void
	 */
	private function set_up_page_request() {
		$GLOBALS['pagenow']     = 'admin.php';
		$GLOBALS['plugin_page'] = Test_WP_Build_Page::MENU_SLUG;
		$_GET['page']           = Test_WP_Build_Page::MENU_SLUG;

		$screen = \WP_Screen::get( self::SCREEN_ID );
		// WP_Screen::get() hands back a cached object, whose ID an earlier test may have aliased.
		$screen->id = self::SCREEN_ID;

		$GLOBALS['current_screen'] = $screen;
	}

	/**
	 * Run the enqueue pass and hand back the initial state it printed.
	 *
	 * @return array|null The state, or null when none was printed.
	 */
	private function printed_initial_state() {
		$handle = Test_WP_Build_Page::WP_BUILD_PAGE . '-wp-admin-prerequisites';
		$prefix = 'window.' . Test_WP_Build_Page::INITIAL_STATE_VAR . ' = ';

		// The script registry outlives a test, and with it anything an earlier one added.
		wp_deregister_script( $handle );
		wp_register_script( $handle, 'https://example.org/prerequisites.js', array(), '1', true );

		Test_WP_Build_Page::enqueue_page_data();

		foreach ( (array) wp_scripts()->get_data( $handle, 'before' ) as $script ) {
			if ( is_string( $script ) && str_starts_with( $script, $prefix ) ) {
				return json_decode( substr( $script, strlen( $prefix ), -1 ), true );
			}
		}

		return null;
	}

	public function test_page_leaves_the_slug_alone_without_a_build() {
		Test_WP_Build_Page::$build_dir = $this->build_dir . '/missing';

		Test_WP_Build_Page::init();

		$this->assertFalse( has_action( 'admin_menu', array( Test_WP_Build_Page::class, 'register_page' ) ) );
	}

	/**
	 * Registration must land after Jetpack's Admin_Menu, and before the WordPress.com menu reads ownership.
	 */
	public function test_page_registers_between_admin_menu_and_the_wpcom_jetpack_submenu() {
		Test_WP_Build_Page::init();
		$priority = has_action( 'admin_menu', array( Test_WP_Build_Page::class, 'register_page' ) );

		$this->assertGreaterThan( 1000, $priority );
		$this->assertLessThan( has_action( 'admin_menu', 'wpcom_add_jetpack_submenu' ), $priority );
	}

	public function test_page_registers_where_routing_finds_it() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();

		Test_WP_Build_Page::register_page();

		$this->assertTrue( Test_WP_Build_Page::owns_page() );
		$this->assertSame( self::SCREEN_ID, get_plugin_page_hook( Test_WP_Build_Page::MENU_SLUG, 'admin.php' ) );
		$this->assertSame( self::SCREEN_ID, Test_WP_Build_Page::get_screen_id() );
	}

	public function test_page_steps_aside_when_another_plugin_owns_the_slug() {
		global $submenu;

		$this->set_up_admin_menu();
		$submenu['jetpack'][] = array( 'Test', 'manage_options', Test_WP_Build_Page::MENU_SLUG, 'Test Page' );

		Test_WP_Build_Page::register_page();

		$this->assertFalse( Test_WP_Build_Page::owns_page() );
		$this->assertNull( Test_WP_Build_Page::get_screen_id() );
		$this->assertCount( 1, array_keys( array_column( $submenu['jetpack'], 2 ), Test_WP_Build_Page::MENU_SLUG, true ) );
	}

	public function test_routes_are_read_from_the_registry_for_this_page_only() {
		$this->assertSame( array( 'test-page', 'test-page-settings' ), Test_WP_Build_Page::get_routes() );
	}

	public function test_render_callback_follows_the_wp_build_page_name() {
		$this->assertSame( 'jetpack_mu_wpcom_test_page_wp_admin_render_page', Test_WP_Build_Page::get_render_callback() );
	}

	public function test_screen_id_is_aliased_for_wp_build_and_restored_after() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();

		Test_WP_Build_Page::alias_screen_id();
		$this->assertSame( Test_WP_Build_Page::WP_BUILD_PAGE, get_current_screen()->id );

		Test_WP_Build_Page::restore_screen_id();
		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	public function test_screen_id_is_left_alone_when_another_plugin_owns_the_page() {
		$this->set_up_page_request();

		Test_WP_Build_Page::alias_screen_id();

		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	/**
	 * Several pages share the base's static state, so one page's ownership must not leak to another.
	 */
	public function test_ownership_is_tracked_per_page() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();

		WPCOM_Backup::alias_screen_id();

		$this->assertFalse( WPCOM_Backup::owns_page() );
		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	public function test_ajax_requests_are_not_page_requests() {
		$this->set_up_page_request();
		$GLOBALS['pagenow'] = 'admin-ajax.php';

		$this->assertFalse( Test_WP_Build_Page::is_page_request() );
	}

	/**
	 * The page reads booleans as booleans, which wp_localize_script() would have turned into "1".
	 */
	public function test_initial_state_reaches_the_page_script_with_its_types() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();

		$this->assertSame( array( 'enabled' => true ), $this->printed_initial_state() );
	}

	public function test_jetpack_config_reaches_the_page_script() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();

		$this->printed_initial_state();

		$before = (array) wp_scripts()->get_data( Test_WP_Build_Page::WP_BUILD_PAGE . '-wp-admin-prerequisites', 'before' );
		$this->assertContains( 'window.jetpackConfig = {"consumer_slug":"jetpack-mu-wpcom"};', $before );
	}

	public function test_initial_state_that_will_not_encode_is_left_out() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();
		Test_WP_Build_Page::$initial_state = array( 'ratio' => INF );

		$this->printed_initial_state();

		$before = (array) wp_scripts()->get_data( Test_WP_Build_Page::WP_BUILD_PAGE . '-wp-admin-prerequisites', 'before' );
		$this->assertStringNotContainsString( Test_WP_Build_Page::INITIAL_STATE_VAR, implode( "\n", array_filter( $before, 'is_string' ) ) );
	}

	public function test_initial_state_is_withheld_from_users_who_cannot_manage_options() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		Test_WP_Build_Page::register_page();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_wp_build_page_subscriber',
					'user_pass'  => 'password',
					'role'       => 'subscriber',
				)
			)
		);

		$this->assertNull( $this->printed_initial_state() );
	}

	public function test_initial_state_is_withheld_when_another_plugin_owns_the_page() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		$GLOBALS['submenu']['jetpack'][] = array( 'Test', 'manage_options', Test_WP_Build_Page::MENU_SLUG, 'Test Page' );

		Test_WP_Build_Page::register_page();

		$this->assertNull( $this->printed_initial_state() );
	}
}
