<?php
/**
 * Tests for Base_Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\RedefineExit\ExitException;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Test_Base_Admin_Menu
 *
 * @covers Automattic\Jetpack\Masterbar\Base_Admin_Menu
 */
class Test_Base_Admin_Menu extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Admin menu instance.
	 *
	 * @var Base_Admin_Menu
	 */
	public static $admin_menu;

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

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
	 * Set up each test.
	 *
	 * @before
	 */
	public function set_up() {
		global $menu, $submenu;

		static::$menu_data    = get_menu_fixture();
		static::$submenu_data = get_submenu_fixture();

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		$admin_menu = $this->get_concrete_menu_admin();

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = $admin_menu::get_instance();
		$menu               = static::$menu_data;
		$submenu            = static::$submenu_data;
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_deregister_script( 'jetpack-admin-menu' );
		wp_deregister_style( 'jetpack-admin-menu' );
		wp_deregister_script( 'jetpack-admin-nav-unification' );
		wp_deregister_style( 'jetpack-admin-nav-unification' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Test get_instance.
	 */
	public function test_get_instance() {

		$admin_menu = $this->get_concrete_menu_admin();

		$instance = $admin_menu::get_instance();

		$this->assertInstanceOf( Base_Admin_Menu::class, $instance );
		$this->assertSame( $instance, static::$admin_menu );

		$this->assertSame( 99998, has_action( 'admin_menu', array( $instance, 'reregister_menu_items' ) ) );
		$this->assertSame( 11, has_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_scripts' ) ) );
	}

	/**
	 * Tests add_admin_menu_separator
	 */
	public function test_add_admin_menu_separator() {
		global $menu;

		// Start with a clean slate.
		$temp_menu = $menu;
		$menu      = array();

		static::$admin_menu->add_admin_menu_separator( 15 );
		static::$admin_menu->add_admin_menu_separator( 10, 'manage_options' );
		'@phan-var non-empty-array $menu';
		$this->assertSame( 'manage_options', $menu[10][1] );
		$this->assertStringContainsString( 'separator-custom-', $menu[10][2] );
		$this->assertSame( 'read', $menu[15][1] );
		$this->assertStringContainsString( 'separator-custom-', $menu[15][2] );

		// Restore filtered $menu.
		$menu = $temp_menu;
	}

	/**
	 * Tests preferred_view
	 */
	public function test_preferred_view() {
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'test.php' ) );
		$this->assertSame( 'unknown', static::$admin_menu->get_preferred_view( 'test.php', false ) );

		update_user_option( get_current_user_id(), 'jetpack_admin_menu_link_destination', true );
		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'test.php' ) );
		delete_user_option( get_current_user_id(), 'jetpack_admin_menu_link_destination' );

		static::$admin_menu->set_preferred_view( 'test.php', 'classic' );
		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'test.php' ) );

		static::$admin_menu->set_preferred_view( 'test.php', 'default' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'test.php', false ) );
	}

	/**
	 * Tests preferred_view
	 */
	public function test_handle_preferred_view() {
		// @see p9dueE-3LL-p2#comment-6669
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->markTestSkipped( 'Does not work on WP.com as handle_preferred_view() performs a redirect and then terminates the execution.' );
		}

		global $pagenow;
		$pagenow                = 'test.php';
		$_GET['preferred-view'] = 'classic';

		$this->expectException( ExitException::class );

		static::$admin_menu->handle_preferred_view();

		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'test.php' ) );
	}

	/**
	 * Tests enqueue_scripts when the user has indicated they want to use the wp-admin interface.
	 */
	public function test_enqueue_scripts_use_wp_admin_interface() {
		update_option( 'wpcom_admin_interface', 'wp-admin' );
		set_current_screen( 'edit-post' );

		do_action( 'admin_enqueue_scripts' );
		$this->assertTrue( wp_script_is( 'jetpack-admin-menu' ) );
		$this->assertTrue( wp_style_is( 'jetpack-admin-menu' ) );
		$this->assertFalse( wp_script_is( 'jetpack-admin-nav-unification' ) );
		$this->assertFalse( wp_style_is( 'jetpack-admin-nav-unification' ) );
	}

	/**
	 * Tests enqueue_scripts
	 */
	public function test_enqueue_scripts() {
		set_current_screen( 'edit-post' );

		do_action( 'admin_enqueue_scripts' );
		$this->assertTrue( wp_script_is( 'jetpack-admin-menu' ) );
		$this->assertTrue( wp_style_is( 'jetpack-admin-menu' ) );
		$this->assertTrue( wp_script_is( 'jetpack-admin-nav-unification' ) );
		$this->assertTrue( wp_style_is( 'jetpack-admin-nav-unification' ) );
	}

	/**
	 * Tests enqueue_scripts with right-to-left text direction.
	 */
	public function test_enqueue_scripts_rtl() {
		Functions\expect( 'is_rtl' )
			->andReturn( true );

		wp_set_current_user( static::$user_id );
		set_current_screen( 'edit-post' );

		do_action( 'admin_enqueue_scripts' );

		$styles            = wp_styles();
		$admin_menu_styles = $styles->registered['jetpack-admin-menu'];
		$nav_unific_styles = $styles->registered['jetpack-admin-nav-unification'];

		$this->assertStringContainsString( 'rtl.css', $admin_menu_styles->src );
		$this->assertStringContainsString( 'rtl.css', $nav_unific_styles->src );
	}

	/**
	 * Get an object of Base_Admin_Menu
	 *
	 * @return Base_Admin_Menu
	 */
	private function get_concrete_menu_admin() {
		return $this->getMockBuilder( Base_Admin_Menu::class )->disableOriginalConstructor()->getMockForAbstractClass();
	}
}
