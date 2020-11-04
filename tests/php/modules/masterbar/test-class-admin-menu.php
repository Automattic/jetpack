<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Admin_Menu;

require_jetpack_file( 'modules/masterbar/class-admin-menu.php' );
require_jetpack_file( 'tests/php/modules/masterbar/data/admin-menu.php' );

/**
 * Class Test_Admin_Menu
 *
 * @coversDefaultClass Automattic\Jetpack\Admin_Menu
 */
class Test_Admin_Menu extends WP_UnitTestCase {

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
	 * Create shared fixtures.
	 */
	public static function wpSetUpBeforeClass() {
		global $menu, $submenu;

		static::$menu_data    = $menu;
		static::$submenu_data = $submenu;

		// Set up actions.
		Admin_Menu::get_instance();

		// Execute actions.
		do_action( 'admin_menu' );
	}

	/**
	 * Test_Admin_Menu.
	 */
	public function test_admin_menu_output() {
		global $menu, $submenu;

		$this->assertEquals( static::$menu_data[80], $menu[80], 'Settings menu should stay the same.' );
		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );
	}
}
