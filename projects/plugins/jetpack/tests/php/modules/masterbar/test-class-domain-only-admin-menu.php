<?php
/**
 * Tests for Domain_Only_Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Domain_Only_Admin_Menu;
use Automattic\Jetpack\Status;

require_jetpack_file( 'modules/masterbar/admin-menu/class-domain-only-admin-menu.php' );
require_jetpack_file( 'tests/php/modules/masterbar/data/admin-menu.php' );

/**
 * Class Test_Domain_Only_Admin_Menu.
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Domain_Only_Admin_Menu
 */
class Test_Domain_Only_Admin_Menu extends WP_UnitTestCase {

	/**
	 * Menu data fixture.
	 *
	 * @var array
	 */
	public static $menu_data;

	/**
	 * Test domain.
	 *
	 * @var string
	 */
	public static $domain;

	/**
	 * Admin menu instance.
	 *
	 * @var Domain_Only_Admin_Menu
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
		static::$domain    = ( new Status() )->get_site_suffix();
		static::$user_id   = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$menu_data = get_menu_fixture();
	}

	/**
	 * Set up data.
	 */
	public function set_up() {
		parent::set_up();
		global $menu;

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = Domain_Only_Admin_Menu::get_instance();

		$menu = static::$menu_data;

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Tests reregister_menu_items.
	 *
	 * @covers ::reregister_menu_items
	 */
	public function test_reregister_menu_items() {
		global $menu;

		static::$admin_menu->reregister_menu_items();

		$this->assertCount( 1, $menu );
		$this->assertEquals( 'https://wordpress.com/domains/manage/' . static::$domain, $menu[0][2] );
	}
}
