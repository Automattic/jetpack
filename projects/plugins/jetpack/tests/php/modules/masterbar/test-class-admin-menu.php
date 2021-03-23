<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Admin_Menu;
use Automattic\Jetpack\Status;

require_jetpack_file( 'modules/masterbar/admin-menu/class-admin-menu.php' );
require_jetpack_file( 'tests/php/modules/masterbar/data/admin-menu.php' );

/**
 * Class Test_Admin_Menu
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Admin_Menu
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
		static::$domain       = ( new Status() )->get_site_suffix();
		static::$user_id      = $factory->user->create( array( 'role' => 'administrator' ) );
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
		static::$admin_menu = Admin_Menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		wp_set_current_user( static::$user_id );
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
			array( 2, '3.86682', 4, 5, 10, 15, 20, 25, 30, 50, 51, 59, 60, 61, 65, 70, 75, 80 ),
			'Admin menu should not have unexpected top menu items.'
		);

		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );
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

		static::$admin_menu->add_my_home_menu();

		// Has My Home submenu item when there are other submenu items.
		$this->assertSame( 'https://wordpress.com/home/' . static::$domain, array_shift( $submenu['index.php'] )[2] );

		// Reset data.
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		// Has no ny Home submenu when there are no other submenus.
		$submenu['index.php'] = array(
			0 => array( 'Home', 'read', 'index.php' ),
		);

		static::$admin_menu->add_my_home_menu();
		$this->assertSame( 'https://wordpress.com/home/' . static::$domain, $menu[2][2] );
		$this->assertEmpty( $submenu['index.php'] );
	}

	/**
	 * Tests add_stats_menu
	 *
	 * @covers ::add_stats_menu
	 */
	public function test_add_stats_menu() {
		global $menu;

		static::$admin_menu->add_stats_menu();

		$this->assertSame( 'https://wordpress.com/stats/day/' . static::$domain, $menu['3.86682'][2] );
	}

	/**
	 * Tests add_upgrades_menu
	 *
	 * @covers ::add_upgrades_menu
	 */
	public function test_add_upgrades_menu() {
		global $submenu;

		static::$admin_menu->add_upgrades_menu();

		$this->assertSame( 'https://wordpress.com/plans/' . static::$domain, array_shift( $submenu['paid-upgrades.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, array_shift( $submenu['paid-upgrades.php'] )[2] );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $submenu;

		static::$admin_menu->add_posts_menu();

		$this->assertSame( 'https://wordpress.com/posts/' . static::$domain, array_shift( $submenu['edit.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/post/' . static::$domain, array_shift( $submenu['edit.php'] )[2] );
	}

	/**
	 * Tests add_media_menu
	 *
	 * @covers ::add_media_menu
	 */
	public function test_add_media_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_media_menu();

		$this->assertSame( 'https://wordpress.com/media/' . static::$domain, $menu[10][2] );
		$this->assertEmpty( $submenu['upload.php'] );
	}

	/**
	 * Tests add_page_menu
	 *
	 * @covers ::add_page_menu
	 */
	public function test_add_page_menu() {
		global $submenu;

		static::$admin_menu->add_page_menu();

		$this->assertSame( 'https://wordpress.com/pages/' . static::$domain, array_shift( $submenu['edit.php?post_type=page'] )[2] );
		$this->assertSame( 'https://wordpress.com/page/' . static::$domain, array_shift( $submenu['edit.php?post_type=page'] )[2] );
	}

	/**
	 * Tests add_custom_post_type_menu
	 *
	 * @covers ::add_custom_post_type_menu
	 */
	public function test_add_custom_post_type_menu() {
		global $menu, $submenu;

		// Don't show post types that don't want to be shown.
		get_post_type_object( 'revision' );
		static::$admin_menu->add_custom_post_type_menu( 'revision' );

		$last_item = array_pop( $menu );
		$this->assertNotSame( 'https://wordpress.com/types/revision/' . static::$domain, $last_item[2] );

		register_post_type(
			'custom_test_type',
			array(
				'label'         => 'Custom Test Types',
				'show_ui'       => true,
				'menu_position' => 2020,
			)
		);

		static::$admin_menu->add_custom_post_type_menu( 'custom_test_type' );

		// Clean up.
		unregister_post_type( 'custom_test_type' );

		$this->assertSame( 'https://wordpress.com/types/custom_test_type/' . static::$domain, array_shift( $submenu['edit.php?post_type=custom_test_type'] )[2] );
		$this->assertSame( 'https://wordpress.com/edit/custom_test_type/' . static::$domain, array_shift( $submenu['edit.php?post_type=custom_test_type'] )[2] );
	}

	/**
	 * Tests add_comments_menu
	 *
	 * @covers ::add_comments_menu
	 */
	public function test_add_comments_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_comments_menu();

		$this->assertSame( 'https://wordpress.com/comments/all/' . static::$domain, $menu[25][2] );
		$this->assertEmpty( $submenu['edit-comments.php'] );
	}

	/**
	 * Tests add_appearance_menu
	 *
	 * @covers ::add_appearance_menu
	 */
	public function test_add_appearance_menu() {
		global $submenu;

		static::$admin_menu->add_appearance_menu();

		$this->assertSame( 'https://wordpress.com/themes/' . static::$domain, array_shift( $submenu['themes.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/customize/' . static::$domain, array_shift( $submenu['themes.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/customize/' . static::$domain . '?autofocus%5Bpanel%5D=nav_menus', array_shift( $submenu['themes.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/customize/' . static::$domain . '?autofocus%5Bpanel%5D=widgets', array_shift( $submenu['themes.php'] )[2] );
	}

	/**
	 * Tests add_plugins_menu
	 *
	 * @covers ::add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_plugins_menu();

		$this->assertSame( 'https://wordpress.com/plugins/' . static::$domain, $menu[65][2] );
		$this->assertEmpty( $submenu['plugins.php'] );

		// Reset.
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		// Check submenu are kept when using WP Admin links.
		static::$admin_menu->add_plugins_menu( true );
		$this->assertNotEmpty( $submenu['plugins.php'] );
	}

	/**
	 * Tests add_users_menu
	 *
	 * @covers ::add_users_menu
	 */
	public function test_add_users_menu() {
		global $menu, $submenu;

		// Current user can't list users.
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'editor' ) ) );
		$menu    = array(
			70 => array(
				'Profile',
				'read',
				'profile.php',
				'',
				'menu-top menu-icon-users',
				'menu-users',
				'dashicons-admin-users',
			),
		);
		$submenu = array(
			'profile.php' => array(
				0 => array( 'Profile', 'read', 'profile.php' ),
			),
		);

		static::$admin_menu->add_users_menu();

		$this->assertSame( 'https://wordpress.com/me', array_shift( $submenu['profile.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/me/account', array_shift( $submenu['profile.php'] )[2] );

		// Reset.
		wp_set_current_user( static::$user_id );
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		static::$admin_menu->add_users_menu();

		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, array_shift( $submenu['users.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/people/new/' . static::$domain, array_shift( $submenu['users.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/me', array_shift( $submenu['users.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/me/account', array_shift( $submenu['users.php'] )[2] );
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $submenu;

		static::$admin_menu->add_tools_menu();

		$this->assertSame( 'https://wordpress.com/marketing/tools/' . static::$domain, array_shift( $submenu['tools.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/earn/' . static::$domain, array_shift( $submenu['tools.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/import/' . static::$domain, array_shift( $submenu['tools.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/export/' . static::$domain, array_shift( $submenu['tools.php'] )[2] );
	}

	/**
	 * Tests add_options_menu
	 *
	 * @covers ::add_options_menu
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu();

		$this->assertSame( 'https://wordpress.com/settings/general/' . static::$domain, array_shift( $submenu['options-general.php'] )[2] );
	}

	/**
	 * Tests add_jetpack_menu
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function add_jetpack_menu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();

		$this->assertSame( 'https://wordpress.com/activity-log/' . static::$domain, $submenu['jetpack'][2][2] );
		$this->assertSame( 'https://wordpress.com/backup/' . static::$domain, $submenu['jetpack'][3][2] );
		$this->assertSame( 'https://wordpress.com/jetpack-search/' . static::$domain, $submenu['jetpack'][4][2] );
	}

	/**
	 * Tests add_gutenberg_menus
	 *
	 * @covers ::add_gutenberg_menus
	 */
	public function test_add_gutenberg_menus() {
		global $menu;
		static::$admin_menu->add_gutenberg_menus( false );

		// FSE is no longer where it was put by default.
		$this->assertArrayNotHasKey( 100, $menu );
		$this->assertArrayHasKey( 61, $menu );

		$fse_link = 'https://wordpress.com/site-editor/' . static::$domain;
		$fse_menu = array(
			'Site Editor',
			'edit_theme_options',
			$fse_link,
			'Site Editor',
			'menu-top toplevel_page_' . $fse_link,
			'toplevel_page_' . $fse_link,
			'dashicons-layout',
		);
		$this->assertSame( $menu[61], $fse_menu );
	}
}
