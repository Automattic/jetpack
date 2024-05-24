<?php
/**
 * Tests for Base_Admin_Menu class.
 *
 * @package jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\RedefineExit\ExitException;
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
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Test get_instance.
	 *
	 * @covers ::get_instance
	 * @covers ::__construct
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
	 *
	 * @covers ::add_admin_menu_separator
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
	 *
	 * @covers ::set_preferred_view
	 * @covers ::get_preferred_views
	 * @covers ::get_preferred_view
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
	 *
	 * @covers ::handle_preferred_view
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
	 * Get an object of Base_Admin_Menu
	 *
	 * @return Base_Admin_Menu
	 */
	private function get_concrete_menu_admin() {
		return $this->getMockBuilder( Base_Admin_Menu::class )->disableOriginalConstructor()->getMockForAbstractClass();
	}
}
