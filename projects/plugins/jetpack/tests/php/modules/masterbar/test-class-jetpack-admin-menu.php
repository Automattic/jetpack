<?php
/**
 * Tests for Jetpack_Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Jetpack_Admin_Menu;
use Automattic\Jetpack\Status;

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-jetpack-admin-menu.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/modules/masterbar/data/admin-menu.php';

/**
 * Class Test_Jetpack_Admin_Menu.
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Jetpack_Admin_Menu
 */
class Test_Jetpack_Admin_Menu extends WP_UnitTestCase {

	/**
	 * Menu data fixture.
	 *
	 * @var array
	 */
	public static $menu_data;

	/**
	 * Submenu data fixture.
	 *
	 * @var array
	 */
	public static $submenu_data;

	/**
	 * Test domain.
	 *
	 * @var string
	 */
	public static $domain;

	/**
	 * Whether this testsuite is run on WP.com.
	 *
	 * @var bool
	 */
	public static $is_wpcom;

	/**
	 * Admin menu instance.
	 *
	 * @var Jetpack_Admin_Menu
	 */
	public static $admin_menu;

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Create shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$domain  = ( new Status() )->get_site_suffix();
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );

		static::$menu_data    = array();
		static::$submenu_data = array();
	}

	/**
	 * Set up data.
	 */
	public function set_up() {
		parent::set_up();
		global $menu, $submenu;

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = Jetpack_Admin_Menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Tests add_jetpack_menu
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function test_add_jetpack_menu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();

		$this->assertSame( 'https://wordpress.com/scan/' . static::$domain, $submenu['jetpack'][2][2] );
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $submenu;

		static::$admin_menu->add_tools_menu();

		// Check Import/Export menu always links to WP Admin.
		$this->assertSame( 'export.php', array_pop( $submenu['tools.php'] )[2] );
		$this->assertSame( 'import.php', array_pop( $submenu['tools.php'] )[2] );
	}

	/**
	 * Tests add_wp_admin_menu
	 *
	 * @covers ::add_wp_admin_menu
	 */
	public function test_add_wp_admin_menu() {
		global $menu;

		static::$admin_menu->add_wp_admin_menu();

		$this->assertSame( 'index.php', array_pop( $menu )[2] );
	}

	/**
	 * Tests add_appearance_menu
	 *
	 * @covers ::add_appearance_menu
	 */
	public function test_add_appearance_menu() {
		global $submenu;

		static::$admin_menu->add_appearance_menu();

		// Check Customize menu always links to WP Admin.
		$this->assertSame( 'customize.php', array_pop( $submenu[ 'https://wordpress.com/themes/' . static::$domain ] )[2] );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $menu;

		static::$admin_menu->add_posts_menu();

		$this->assertSame( 'https://wordpress.com/posts/' . static::$domain, array_shift( $menu )[2] );
	}

	/**
	 * Tests add_page_menu
	 *
	 * @covers ::add_page_menu
	 */
	public function test_add_page_menu() {
		global $menu;

		static::$admin_menu->add_page_menu();

		$this->assertSame( 'https://wordpress.com/pages/' . static::$domain, array_shift( $menu )[2] );
	}

	/**
	 * Tests add_users_menu
	 *
	 * @covers ::add_users_menu
	 */
	public function test_add_users_menu() {
		global $menu;

		static::$admin_menu->add_users_menu();

		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, array_shift( $menu )[2] );
	}

	/**
	 * Tests add_users_menu
	 *
	 * @covers ::add_feedback_menu
	 */
	public function add_feedback_menu() {
		global $menu;

		static::$admin_menu->add_feedback_menu();

		$this->assertSame( 'edit.php?post_type=feedback', array_shift( $menu )[2] );
	}

	/**
	 * Tests add_plugins_menu
	 *
	 * @covers ::add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $menu;

		static::$admin_menu->add_plugins_menu();

		// Check Plugins menu always links to Calypso.
		$this->assertSame( 'https://wordpress.com/plugins/' . static::$domain, array_shift( $menu )[2] );
	}
}
