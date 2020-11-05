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
	 * Test domain.
	 *
	 * @var string
	 */
	public static $domain;

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
		global $menu, $submenu;

		static::$menu_data    = $menu;
		static::$submenu_data = $submenu;
		static::$domain       = wp_parse_url( get_home_url(), PHP_URL_HOST );

		static::$user_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function setUp() {
		parent::setUp();

		wp_set_current_user( static::$user_id );

		// Set up actions.
		Admin_Menu::get_instance();

		// Execute actions.
		do_action( 'admin_menu' );
	}

	/**
	 * Test_Admin_Menu.
	 *
	 * @covers ::reregister_menu_items
	 */
	public function test_admin_menu_output() {
		global $menu, $submenu;

		$this->assertEquals( static::$menu_data[80], $menu[80], 'Settings menu should stay the same.' );
		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );

		$this->assertSame(
			array_keys( $menu ),
			array( 2, 3, '3.86682', 4, 5, 10, 15, 20, 25, 59, 60, 65, 70, '70.026', 75, 80 ),
			'Admin menu should not have unexpected top menu items.'
		);
	}

	/**
	 * Tests add_purchases_menu
	 *
	 * @covers ::add_purchases_menu
	 */
	public function test_add_purchases_menu() {
		global $menu, $submenu;

		$purchases_menu_item = array(
			'Purchases',
			'manage_options',
			'https://wordpress.com/plans/' . static::$domain,
			'Purchases',
			'menu-top toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'dashicons-cart',
		);

		$this->assertSame( $menu[4], $purchases_menu_item );
		$this->assertArrayNotHasKey( 'https://wordpress.com/plans/' . static::$domain, $submenu );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $menu, $submenu;

		$posts_menu_item = array(
			'Posts',
			'edit_posts',
			'https://wordpress.com/posts/' . static::$domain,
			'Posts',
			'menu-top toplevel_page_https://wordpress.com/posts/' . static::$domain,
			'toplevel_page_https://wordpress.com/posts/' . static::$domain,
			'dashicons-admin-post',
		);

		$this->assertSame( $menu[5], $posts_menu_item );
		$this->assertArrayNotHasKey( 'edit.php', $submenu );
	}
}
