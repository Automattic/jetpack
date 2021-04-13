<?php
/**
 * Tests for Base_Admin_Menu class.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'modules/masterbar/admin-menu/class-base-admin-menu.php' );

use \Automattic\Jetpack\Dashboard_Customizations\Base_Admin_Menu;

/**
 * Class Test_Base_Admin_Menu
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Base_Admin_Menu
 */
class Test_Base_Admin_Menu extends WP_UnitTestCase {

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
	 * Create shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$menu_data    = get_menu_fixture();
		static::$submenu_data = get_submenu_fixture();
	}

	/**
	 * Set up data.
	 */
	public function setUp() {
		parent::setUp();

		$admin_menu = $this->get_concrete_menu_admin();

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = $admin_menu::get_instance();

		wp_set_current_user( static::$user_id );
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

		$this->assertSame( 99999, has_action( 'admin_menu', array( $instance, 'reregister_menu_items' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_scripts' ) ) );
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

		$this->assertSame( 'manage_options', $menu[10][1] );
		$this->assertContains( 'separator-custom-', $menu[10][2] );
		$this->assertSame( 'read', $menu[15][1] );
		$this->assertContains( 'separator-custom-', $menu[15][2] );

		// Restore filtered $menu.
		$menu = $temp_menu;
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
