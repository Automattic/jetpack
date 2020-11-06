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
	 * Admin menu instance.
	 *
	 * @var Admin_Menu
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
		global $menu, $submenu;

		require_jetpack_file( 'tests/php/modules/masterbar/data/admin-menu.php' );

		static::$menu_data    = $menu;
		static::$submenu_data = $submenu;
		static::$domain       = wp_parse_url( get_home_url(), PHP_URL_HOST );

		static::$user_id    = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$admin_menu = Admin_Menu::get_instance();
	}

	/**
	 * Set up data.
	 */
	public function setUp() {
		parent::setUp();

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Reset data.
	 */
	public function tearDown() {
		global $menu, $submenu;

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		parent::tearDown();
	}

	/**
	 * Test_Admin_Menu.
	 *
	 * @covers ::reregister_menu_items
	 */
	public function test_admin_menu_output() {
		global $menu, $submenu;

		static::$admin_menu->reregister_menu_items();

		$this->assertSame(
			array_keys( $menu ),
			array( 2, 3, '3.86682', 4, 5, 10, 15, 20, 25, 59, 60, 65, 70, 75, 80 ),
			'Admin menu should not have unexpected top menu items.'
		);

		$this->assertEquals( static::$menu_data[80], $menu[80], 'Settings menu should stay the same.' );
		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );
	}

	/**
	 * Tests add_my_home_menu
	 *
	 * @covers ::add_my_home_menu
	 */
	public function test_add_my_home_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_my_home_menu( static::$domain );

		$slug = 'https://wordpress.com/home/' . static::$domain;

		$my_home_menu_item = array(
			'My Home',
			'read',
			$slug,
			'My Home',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-home',
		);
		$this->assertSame( $menu[2], $my_home_menu_item );

		// Has My Home submenu item when there are other submenu items.
		$my_home_submenu_item = array(
			'My Home',
			'read',
			$slug,
			'My Home',
		);
		$this->assertContains( $my_home_submenu_item, $submenu[ $slug ] );
		// Reset data.
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		// Has no ny Home submenu when there are no other submenus.
		$submenu['index.php'] = array(
			0 => array( 'Home', 'read', 'index.php' ),
		);

		static::$admin_menu->add_my_home_menu( static::$domain );

		$this->assertArrayNotHasKey( 'https://wordpress.com/home/' . static::$domain, $submenu );
	}

	/**
	 * Tests add_purchases_menu
	 *
	 * @covers ::add_purchases_menu
	 */
	public function test_add_purchases_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_purchases_menu( static::$domain );

		$purchases_menu_item = array(
			'Purchases',
			'manage_options',
			'https://wordpress.com/plans/' . static::$domain,
			'Purchases',
			'menu-top toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'dashicons-cart',
		);

		$this->assertSame( $menu['4.62024'], $purchases_menu_item );
		$this->assertArrayNotHasKey( 'https://wordpress.com/plans/' . static::$domain, $submenu );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_posts_menu( static::$domain );

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

	/**
	 * Tests add_plugins_menu
	 *
	 * @covers ::add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $menu, $submenu;

		add_filter( 'wp_get_update_data', array( $this, 'mock_update_data' ) );
		add_filter( 'jetpack_admin_menu_is_wpcom', '__return_true' );

		static::$admin_menu->add_plugins_menu( static::$domain );

		remove_filter( 'wp_get_update_data', array( $this, 'mock_update_data' ) );
		remove_filter( 'jetpack_admin_menu_is_wpcom', '__return_true' );

		$slug = 'https://wordpress.com/plugins/' . static::$domain;

		$plugins_menu_item = array(
			'Plugins <span class="update-plugins count-0"><span class="plugin-count">0</span></span>',
			'activate_plugins',
			$slug,
			'Plugins',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-plugins',
		);

		$this->assertEquals( $plugins_menu_item, $menu[65] );
		$this->assertArrayNotHasKey( 'plugins.php', $submenu );

		$editor_submenu_item = array(
			'Plugin Editor',
			'edit_plugins',
			'plugin-editor.php',
		);
		$this->assertNotContains( $editor_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Filters the returned array of update data for plugins, themes, and WordPress core.
	 */
	public function mock_update_data() {
		return array(
			'counts' => array(
				'plugins'      => 0,
				'themes'       => 0,
				'translations' => 0,
				'wordpress'    => 0,
			),
			'title'  => '',
		);
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $menu, $submenu;

		$slug = 'https://wordpress.com/marketing/tools/' . static::$domain;
		static::$admin_menu->add_tools_menu( static::$domain );

		$tools_menu_item = array(
			'Tools',
			'manage_options',
			$slug,
			'Tools',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-tools',
		);

		$this->assertSame( $menu[75], $tools_menu_item );
		$this->assertArrayNotHasKey( 'tools.php', $submenu );

		// Contains the following menu items.

		$marketing_submenu_item = array(
			'Marketing',
			'manage_options',
			'https://wordpress.com/marketing/tools/' . static::$domain,
			'Marketing',
		);
		$this->assertContains( $marketing_submenu_item, $submenu[ $slug ] );

		$earn_submenu_item = array(
			'Earn',
			'manage_options',
			'https://wordpress.com/earn/' . static::$domain,
			'Earn',
		);
		$this->assertContains( $earn_submenu_item, $submenu[ $slug ] );

		$import_submenu_item = array(
			'Import',
			'import',
			'https://wordpress.com/import/' . static::$domain,
			'Import',
		);
		$this->assertContains( $import_submenu_item, $submenu[ $slug ] );

		$export_submenu_item = array(
			'Export',
			'export',
			'https://wordpress.com/export/' . static::$domain,
			'Export',
		);
		$this->assertContains( $export_submenu_item, $submenu[ $slug ] );

		// NOT contains the following menu items.

		$tools_submenu_item = array(
			'Available Tools',
			'edit_posts',
			'tools.php',
		);
		$this->assertNotContains( $tools_submenu_item, $submenu[ $slug ] );

		$import_submenu_item = array(
			'Import',
			'import',
			'import.php',
		);
		$this->assertNotContains( $import_submenu_item, $submenu[ $slug ] );

		$export_submenu_item = array(
			'Export',
			'export',
			'export.php',
		);
		$this->assertNotContains( $export_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_options_menu
	 *
	 * @covers ::add_options_menu
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu( static::$domain );

		$this->assertNotContains( 'options-discussion.php', $submenu['options-general.php'] );
		$this->assertNotContains( 'options-writing.php', $submenu['options-general.php'] );

		$this->assertContains( 'Domains', $submenu['options-general.php'][1] );
		$this->assertContains( 'Hosting Configuration', $submenu['options-general.php'][6] );
	}

	/**
	 * Tests migrate_submenus
	 *
	 * @covers ::migrate_submenus
	 */
	public function test_migrate_submenus() {
		global $submenu;

		$new_slug = 'made-up-slug';

		// Start with a clean slate.
		$temp_submenu = $submenu;
		$submenu      = static::$submenu_data;

		// New slug doesn't exist yet.
		static::$admin_menu->migrate_submenus( 'edit.php', $new_slug );
		$this->assertArrayNotHasKey( 'edit.php', $submenu );
		$this->assertSame( static::$submenu_data['edit.php'], $submenu[ $new_slug ] );

		// New slug exists.
		static::$admin_menu->migrate_submenus( 'upload.php', $new_slug );
		$this->assertArrayNotHasKey( 'upload.php', $submenu );
		$expected = array_replace( static::$submenu_data['edit.php'], static::$submenu_data['upload.php'] );
		$this->assertSame( $expected, $submenu[ $new_slug ] );

		// Old slug doesn't exist.
		$this->assertArrayNotHasKey( 'unkown', $submenu );
		$pre_migration = $submenu;
		static::$admin_menu->migrate_submenus( 'unkown', $new_slug );
		$this->assertSame( $pre_migration, $submenu );

		// Slugs are the same.
		$this->assertArrayHasKey( 'index.php', $submenu );
		$pre_migration = $submenu;
		static::$admin_menu->migrate_submenus( 'index.php', 'index.php' );
		$this->assertSame( $pre_migration, $submenu );

		// Restore filtered $submenu.
		$submenu = $temp_submenu;
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

		$this->assertSame( array( 10, 15 ), array_keys( $menu ), 'Menu should be ordered by position parameter.' );
		$this->assertSame( 'manage_options', $menu[10][1] );
		$this->assertSame( 'separator-custom-5', $menu[10][2] );
		$this->assertSame( 'read', $menu[15][1] );
		$this->assertSame( 'separator-custom-4', $menu[15][2] );

		// Restore filtered $menu.
		$menu = $temp_menu;
	}
}
