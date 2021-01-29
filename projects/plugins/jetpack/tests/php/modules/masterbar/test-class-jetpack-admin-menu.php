<?php
/**
 * Tests for Jetpack_Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Jetpack_Admin_Menu;
use Automattic\Jetpack\Status;

require_jetpack_file( 'modules/masterbar/admin-menu/class-admin-menu.php' );
require_jetpack_file( 'modules/masterbar/admin-menu/class-jetpack-admin-menu.php' );
require_jetpack_file( 'tests/php/modules/masterbar/data/admin-menu.php' );

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

		static::$menu_data    = get_menu_fixture();
		static::$submenu_data = get_submenu_fixture();
	}

	/**
	 * Set up data.
	 */
	public function setUp() {
		parent::setUp();
		global $menu, $submenu;

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = Jetpack_Admin_Menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Test get_instance.
	 *
	 * @covers ::get_instance
	 * @covers ::__construct
	 */
	public function test_get_instance() {
		$instance = Jetpack_Admin_Menu::get_instance();

		$this->assertInstanceOf( Jetpack_Admin_Menu::class, $instance );
		$this->assertSame( $instance, static::$admin_menu );

		$this->assertSame( 99999, has_action( 'admin_menu', array( $instance, 'reregister_menu_items' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_scripts' ) ) );
	}

	/**
	 * Tests add_jetpack_menu
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function test_add_jetpack_menu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();

		$domains_submenu_item = array(
			'Scan',
			'manage_options',
			'https://wordpress.com/scan/' . static::$domain,
			'Scan',
		);
		$this->assertContains( $domains_submenu_item, $submenu[ 'https://wordpress.com/activity-log/' . static::$domain ] );
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $submenu;

		$slug = 'https://wordpress.com/marketing/tools/' . static::$domain;
		static::$admin_menu->add_tools_menu( false, false );

		// Check Import menu always links to WP Admin.
		$import_submenu_item = array(
			'Import',
			'import',
			'import.php',
			'Import',
		);
		$this->assertContains( $import_submenu_item, $submenu[ $slug ] );

		// Check Export menu always links to WP Admin.
		$export_submenu_item = array(
			'Export',
			'export',
			'export.php',
			'Export',
		);
		$this->assertContains( $export_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_appearance_menu
	 *
	 * @covers ::add_appearance_menu
	 */
	public function add_appearance_menu() {
		global $submenu;

		$slug = 'https://wordpress.com/themes/' . static::$domain;
		static::$admin_menu->add_appearance_menu( false, false );

		// Check Customize menu always links to WP Admin.
		$customize_submenu_item = array(
			'Customize',
			'customize',
			'customize.php',
			'Customize',
		);
		$this->assertContains( $customize_submenu_item, $submenu[ $slug ] );
	}
}
