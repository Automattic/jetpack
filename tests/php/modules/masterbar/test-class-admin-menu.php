<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Admin_Menu;

require_jetpack_file( 'modules/masterbar/class-admin-menu.php' );

/**
 * Class Test_Admin_Menu
 *
 * @coversDefaultClass Automattic\Jetpack\Admin_Menu
 */
class Test_Admin_Menu extends WP_UnitTestCase {
	/**
	 * Test_Admin_Menu.
	 */
	public function test_admin_menu_output() {
		$this->markTestIncomplete();

		Admin_Menu::get_instance();
	}
}
