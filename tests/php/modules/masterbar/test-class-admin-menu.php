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
	 * Tests add_browse_sites_link.
	 *
	 * @covers ::add_browse_sites_link
	 */
	public function test_add_browse_sites_link() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Only used on multisite' );
		}
		global $menu;

		static::$admin_menu->add_browse_sites_link();
		$this->assertArrayNotHasKey( 0, $menu );

		// Give user a second site.
		$blog_id = $this->factory->blog->create();
		add_user_to_blog( $blog_id, get_current_user_id(), 'editor' );

		static::$admin_menu->add_browse_sites_link();

		$browse_sites_menu_item = array(
			'Browse sites',
			'read',
			'https://wordpress.com/home',
			'Browse sites',
			'menu-top toplevel_page_https://wordpress.com/home',
			'toplevel_page_https://wordpress.com/home',
			'dashicons-arrow-left-alt2',
		);
		$this->assertSame( $menu[0], $browse_sites_menu_item );

		remove_user_from_blog( get_current_user_id(), $blog_id );
	}

	/**
	 * Tests add_site_card_menu
	 *
	 * @covers ::add_site_card_menu
	 */
	public function test_add_site_card_menu() {
		global $menu;

		static::$admin_menu->add_site_card_menu( static::$domain );

		$home_url            = home_url();
		$site_card_menu_item = array(
			// phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
			"
<div class=\"site__info\">
	<div class=\"site__title\">Test Blog</div>
	<div class=\"site__domain\">" . static::$domain . "</div>
\t
</div>",
			'read',
			$home_url,
			'site-card',
			'menu-top toplevel_page_' . $home_url,
			'toplevel_page_' . $home_url,
			'data:image/svg+xml,%3Csvg%20class%3D%22gridicon%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Ctitle%3EGlobe%3C%2Ftitle%3E%3Crect%20fill-opacity%3D%220%22%20x%3D%220%22%20width%3D%2224%22%20height%3D%2224%22%2F%3E%3Cg%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M12%202C6.477%202%202%206.477%202%2012s4.477%2010%2010%2010%2010-4.477%2010-10S17.523%202%2012%202zm0%2018l2-2%201-1v-2h-2v-1l-1-1H9v3l2%202v1.93c-3.94-.494-7-3.858-7-7.93l1%201h2v-2h2l3-3V6h-2L9%205v-.41C9.927%204.21%2010.94%204%2012%204s2.073.212%203%20.59V6l-1%201v2l1%201%203.13-3.13c.752.897%201.304%201.964%201.606%203.13H18l-2%202v2l1%201h2l.286.286C18.03%2018.06%2015.24%2020%2012%2020z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E',
		);

		$this->assertEquals( $menu[1], $site_card_menu_item );
	}

	/**
	 * Tests set_site_card_menu_class
	 *
	 * @covers ::set_site_card_menu_class
	 */
	public function test_set_site_card_menu_class() {
		global $menu;

		static::$admin_menu->add_site_card_menu( static::$domain );

		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		$this->assertNotContains( 'has-site-icon', $menu[1][4] );

		// Atomic fallback site icon counts as no site icon.
		add_filter( 'get_site_icon_url', array( $this, 'wpcomsh_site_icon_url' ) );
		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		remove_filter( 'get_site_icon_url', array( $this, 'wpcomsh_site_icon_url' ) );
		$this->assertNotContains( 'has-site-icon', $menu[1][4] );

		// Custom site icon triggers CSS class.
		add_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		remove_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$this->assertContains( 'has-site-icon', $menu[1][4] );
	}

	/**
	 * Shim wpcomsh fallback site icon.
	 *
	 * @return string
	 */
	public function wpcomsh_site_icon_url() {
		return 'https://s0.wp.com/i/webclip.png';
	}

	/**
	 * Custom site icon.
	 *
	 * @return string
	 */
	public function custom_site_icon_url() {
		return 'https://s0.wp.com/i/jetpack.png';
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
	 * Tests add_stats_menu
	 *
	 * @covers ::add_stats_menu
	 */
	public function test_add_stats_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_stats_menu( static::$domain );

		$stats_menu_item = array(
			'Stats',
			'edit_posts',
			'https://wordpress.com/stats/day/' . static::$domain,
			'Stats',
			'menu-top toplevel_page_https://wordpress.com/stats/day/' . static::$domain,
			'toplevel_page_https://wordpress.com/stats/day/' . static::$domain,
			'dashicons-chart-bar',
		);

		$this->assertSame( $menu['3.86682'], $stats_menu_item );
		$this->assertArrayNotHasKey( 'https://wordpress.com/stats/day/' . static::$domain, $submenu );
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
	 * Tests add_media_menu
	 *
	 * @covers ::add_media_menu
	 */
	public function test_add_media_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_media_menu( static::$domain );

		$slug = 'https://wordpress.com/media/' . static::$domain;

		$media_menu_item = array(
			'Media',
			'upload_files',
			$slug,
			'Media',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-media',
		);

		$this->assertSame( $menu[10], $media_menu_item );
		$this->assertArrayNotHasKey( $slug, $submenu );

		$library_submenu_item = array(
			'Library',
			'upload_files',
			'upload.php',
		);
		$this->assertNotContains( $library_submenu_item, $submenu['upload.php'] );

		$add_new_submenu_item = array(
			'Add New',
			'upload_files',
			'media-new.php',
		);
		$this->assertNotContains( $add_new_submenu_item, $submenu['upload.php'] );
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

		$slug  = 'https://wordpress.com/plugins/' . static::$domain;
		$label = is_multisite() ? 'Plugins ' : 'Plugins <span class="update-plugins count-0"><span class="plugin-count">0</span></span>';

		$plugins_menu_item = array(
			$label,
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
