<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Admin_Menu;
use Automattic\Jetpack\Redirect;
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
	 * Test get_instance.
	 *
	 * @covers ::get_instance
	 * @covers ::__construct
	 */
	public function test_get_instance() {
		$instance = Admin_Menu::get_instance();

		$this->assertInstanceOf( Admin_Menu::class, $instance );
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

		$this->assertSame( array( 10, 15 ), array_keys( $menu ), 'Menu should be ordered by position parameter.' );
		$this->assertSame( 'manage_options', $menu[10][1] );
		$this->assertContains( 'separator-custom-', $menu[10][2] );
		$this->assertSame( 'read', $menu[15][1] );
		$this->assertContains( 'separator-custom-', $menu[15][2] );

		// Restore filtered $menu.
		$menu = $temp_menu;
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
			array( 2, '3.86682', 4, 5, 10, 15, 20, 25, 50, 51, 59, 60, 65, 70, 75, 80 ),
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

		static::$admin_menu->add_my_home_menu( false );

		$slug = 'https://wordpress.com/home/' . static::$domain;

		$my_home_menu_item = array(
			'My Home',
			'manage_options',
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
			'manage_options',
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

		static::$admin_menu->add_my_home_menu( false );

		$this->assertArrayNotHasKey( 'https://wordpress.com/home/' . static::$domain, $submenu );
	}

	/**
	 * Tests add_stats_menu
	 *
	 * @covers ::add_stats_menu
	 */
	public function test_add_stats_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_stats_menu();

		$menu_title = __( 'Stats', 'jetpack' );

		if ( ! defined( 'TESTING_IN_JETPACK' ) || ! TESTING_IN_JETPACK ) {
			$menu_title .= sprintf(
				'<img class="sidebar-unified__sparkline" width="80" height="20" src="%1$s" alt="%2$s">',
				esc_url( home_url( 'wp-includes/charts/admin-bar-hours-scale-2x.php?masterbar=1&s=' . get_current_blog_id() ) ),
				esc_attr__( 'Hourly views', 'jetpack' )
			);
		}
		$stats_menu_item = array(
			$menu_title,
			'view_stats',
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
	 * Tests add_upgrades_menu
	 *
	 * @covers ::add_upgrades_menu
	 */
	public function test_add_wpcom_upgrades_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_upgrades_menu();

		$slug = 'https://wordpress.com/plans/' . static::$domain;

		$upgrades_menu_item = array(
			'Upgrades',
			'manage_options',
			$slug,
			'Upgrades',
			'menu-top toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'dashicons-cart',
		);
		$this->assertSame( $menu['4.80608'], $upgrades_menu_item );

		$plans_submenu_item = array(
			'Plans',
			'manage_options',
			$slug,
			'Plans',
		);
		$this->assertContains( $plans_submenu_item, $submenu[ $slug ] );

		$purchases_submenu_item = array(
			'Purchases',
			'manage_options',
			'https://wordpress.com/purchases/subscriptions/' . static::$domain,
			'Purchases',
		);
		$this->assertContains( $purchases_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_jetpack_upgrades_menu
	 *
	 * @covers ::add_jetpack_upgrades_menu
	 */
	public function test_add_jetpack_upgrades_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_upgrades_menu();

		$slug = 'https://wordpress.com/plans/' . static::$domain;

		$upgrades_menu_item = array(
			'Upgrades',
			'manage_options',
			$slug,
			'Upgrades',
			'menu-top toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'toplevel_page_https://wordpress.com/plans/' . static::$domain,
			'dashicons-cart',
		);
		$this->assertSame( $menu['4.80608'], $upgrades_menu_item );
		$this->assertArrayNotHasKey( 'https://wordpress.com/domains/manage/' . static::$domain, $submenu );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_posts_menu( false );

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

		static::$admin_menu->add_media_menu( false );

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
	 * Tests add_page_menu
	 *
	 * @covers ::add_page_menu
	 */
	public function test_add_page_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_page_menu( false );

		$posts_menu_item = array(
			'Pages',
			'edit_pages',
			'https://wordpress.com/pages/' . static::$domain,
			'Pages',
			'menu-top toplevel_page_https://wordpress.com/pages/' . static::$domain,
			'toplevel_page_https://wordpress.com/pages/' . static::$domain,
			'dashicons-admin-page',
		);

		$this->assertSame( $menu[20], $posts_menu_item );
		$this->assertEmpty( $submenu['edit.php?post_type=page'] );
	}

	/**
	 * Tests add_custom_post_type_menu
	 *
	 * @covers ::add_custom_post_type_menu
	 */
	public function test_add_custom_post_type_menu() {
		global $menu, $submenu;

		// Don't show post types that don't want to be shown.
		$revision = get_post_type_object( 'revision' );
		static::$admin_menu->add_custom_post_type_menu( $revision, false );

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
		static::$admin_menu->add_custom_post_type_menu( 'custom_test_type', false );

		// Clean up.
		unregister_post_type( 'custom_test_type' );

		$slug = 'https://wordpress.com/types/custom_test_type/' . static::$domain;

		$custom_menu_item = array(
			'Custom Test Types',
			'edit_posts',
			$slug,
			'Custom Test Types',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-post',
		);

		$this->assertSame( $menu[2020], $custom_menu_item );

		$custom_submenu_item = array(
			'Custom Test Types',
			'edit_posts',
			'https://wordpress.com/types/custom_test_type/' . static::$domain,
			'Custom Test Types',
		);
		$this->assertContains( $custom_submenu_item, $submenu[ $slug ] );

		$add_new_submenu_item = array(
			'Add New',
			'edit_posts',
			'https://wordpress.com/edit/custom_test_type/' . static::$domain,
			'Add New',
		);
		$this->assertContains( $add_new_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_comments_menu
	 *
	 * @covers ::add_comments_menu
	 */
	public function test_add_comments_menu() {
		global $menu, $submenu;

		// Only users that can edit posts get to see the comments menu.
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'subscriber' ) ) );
		$menu = array();
		static::$admin_menu->add_comments_menu( false );
		$this->assertEmpty( $menu );

		// Reset.
		wp_set_current_user( static::$user_id );
		$menu = static::$menu_data;

		static::$admin_menu->add_comments_menu( false );

		$comments_menu_item = array(
			'Comments <span class="awaiting-mod count-0"><span class="pending-count" aria-hidden="true">0</span><span class="comments-in-moderation-text screen-reader-text">0 Comments in moderation</span></span>',
			'edit_posts',
			'https://wordpress.com/comments/all/' . static::$domain,
			'Comments',
			'menu-top toplevel_page_https://wordpress.com/comments/all/' . static::$domain,
			'toplevel_page_https://wordpress.com/comments/all/' . static::$domain,
			'dashicons-admin-comments',
		);

		$this->assertSame( $menu[25], $comments_menu_item );
		$this->assertEmpty( $submenu['edit-comments.php'] );
	}

	/**
	 * Tests add_appearance_menu
	 *
	 * @covers ::add_appearance_menu
	 */
	public function test_add_appearance_menu() {
		global $menu, $submenu;
		$customize_slug = 'https://wordpress.com/customize/' . static::$domain;
		static::$admin_menu->add_appearance_menu( false );

		$slug = 'https://wordpress.com/themes/' . static::$domain;

		$appearance_menu_item = array(
			'Appearance',
			'switch_themes',
			$slug,
			'Appearance',
			'menu-top toplevel_page_' . $slug,
			'menu-appearance',
			'dashicons-admin-appearance',
		);

		$this->assertSame( $menu[60], $appearance_menu_item );
		$this->assertArrayNotHasKey( 'themes.php', $submenu );

		$themes_submenu_item = array(
			'Themes',
			'switch_themes',
			'https://wordpress.com/themes/' . static::$domain,
			'Themes',
		);
		$this->assertContains( $themes_submenu_item, $submenu[ $slug ] );

		$customize_submenu_item = array(
			'Customize',
			'customize',
			$customize_slug,
			'Customize',
		);

		$this->assertContains( $customize_submenu_item, $submenu[ $slug ] );

		$widgets_submenu_item = array(
			'Widgets',
			'customize',
			$customize_slug . '?autofocus%5Bpanel%5D=widgets',
			'Widgets',
		);
		$this->assertContains( $widgets_submenu_item, $submenu[ $slug ] );

		$menus_submenu_item = array(
			'Menus',
			'customize',
			$customize_slug . '?autofocus%5Bpanel%5D=nav_menus',
			'Menus',
		);
		$this->assertContains( $menus_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_plugins_menu
	 *
	 * @covers ::add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $menu, $submenu;

		add_filter( 'wp_get_update_data', array( $this, 'mock_update_data' ) );
		static::$admin_menu->add_plugins_menu( false );
		remove_filter( 'wp_get_update_data', array( $this, 'mock_update_data' ) );

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
		$this->assertEmpty( $submenu['plugins.php'] );
		$this->assertArrayNotHasKey( $slug, $submenu );
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
	 * Tests add_users_menu
	 *
	 * @covers ::add_users_menu
	 */
	public function test_add_users_menu() {
		global $menu, $submenu;

		// Current user can't list users.
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'editor' ) ) );
		$menu = array();

		static::$admin_menu->add_users_menu( false );

		$this->assertEmpty( $menu );

		// Reset.
		wp_set_current_user( static::$user_id );
		$menu = static::$menu_data;

		static::$admin_menu->add_users_menu( false );

		$slug = 'https://wordpress.com/people/team/' . static::$domain;

		$users_menu_item = array(
			'Users',
			'list_users',
			$slug,
			'Users',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			'dashicons-admin-users',
		);
		$this->assertSame( $menu[70], $users_menu_item );
		$this->assertEmpty( $submenu['users.php'] );

		$all_people_submenu_item = array(
			'All People',
			'list_users',
			$slug,
			'All People',
		);
		$this->assertContains( $all_people_submenu_item, $submenu[ $slug ] );

		$add_new_submenu_item = array(
			'Add New',
			'promote_users',
			'https://wordpress.com/people/new/' . static::$domain,
			'Add New',
		);
		$this->assertContains( $add_new_submenu_item, $submenu[ $slug ] );

		$profile_submenu_item = array(
			'My Profile',
			'read',
			'https://wordpress.com/me',
			'My Profile',
		);
		$this->assertContains( $profile_submenu_item, $submenu[ $slug ] );

		$account_submenu_item = array(
			'Account Settings',
			'read',
			'https://wordpress.com/me/account',
			'Account Settings',
		);
		$this->assertContains( $account_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $menu, $submenu;

		$slug = 'https://wordpress.com/marketing/tools/' . static::$domain;
		static::$admin_menu->add_tools_menu( false, false );

		$tools_menu_item = array(
			'Tools',
			'publish_posts',
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
			'publish_posts',
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

		$other_tools_submenu_item = array(
			'Other tools',
			'manage_options',
			'tools.php',
			'Other tools',
		);
		$this->assertContains( $other_tools_submenu_item, $submenu[ $slug ] );

		// NOT contains the following menu items.

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

		$slug = 'https://wordpress.com/settings/general/' . static::$domain;
		static::$admin_menu->add_options_menu( false );

		$this->assertNotContains( 'options-discussion.php', $submenu[ $slug ] );
		$this->assertNotContains( 'options-writing.php', $submenu[ $slug ] );

		$general_submenu_item = array(
			'General',
			'manage_options',
			$slug,
			'General',
		);
		$this->assertContains( $general_submenu_item, $submenu[ $slug ] );
	}

	/**
	 * Tests add_jetpack_menu
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function add_jetpack_menu() {
		global $menu, $submenu;

		$slug = 'https://wordpress.com/activity-log/' . static::$domain;
		static::$admin_menu->add_jetpack_menu();

		// TODO: Replace with proper SVG data url.
		$jetpack_icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 32 32' %3E%3Cpath fill='%23a0a5aa' d='M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z'%3E%3C/path%3E%3Cpolygon fill='%23fff' points='15,19 7,19 15,3 '%3E%3C/polygon%3E%3Cpolygon fill='%23fff' points='17,29 17,13 25,13 '%3E%3C/polygon%3E%3C/svg%3E";

		$jetpack_menu_item = array(
			'Jetpack',
			'manage_options',
			$slug,
			'Jetpack',
			'menu-top toplevel_page_' . $slug,
			'toplevel_page_' . $slug,
			$jetpack_icon,
		);

		$this->assertSame( $menu[50], $jetpack_menu_item );
		$this->assertArrayNotHasKey( 'jetpack', $submenu );

		// Contains the following menu items.

		$activity_log_submenu_item = array(
			'Activity Log',
			'manage_options',
			'https://wordpress.com/activity-log/' . static::$domain,
			'Activity Log',
		);
		$this->assertContains( $activity_log_submenu_item, $submenu[ $slug ] );

		$backup_submenu_item = array(
			'Backup',
			'manage_options',
			'https://wordpress.com/backup/' . static::$domain,
			'Backup',
		);
		$this->assertContains( $backup_submenu_item, $submenu[ $slug ] );

		$search_submenu_item = array(
			'Search',
			'read',
			'https://wordpress.com/jetpack-search/' . static::$domain,
			'Search',
		);
		$this->assertContains( $search_submenu_item, $submenu[ $slug ] );

		// NOT contains the following menu items.

		$stats_submenu_item = array(
			'Stats',
			'manage_options',
			'stats',
		);
		$this->assertNotContains( $stats_submenu_item, $submenu[ $slug ] );

		$backups_submenu_item = array(
			'Backup &amp; Scan',
			'manage_options',
			esc_url( Redirect::get_url( 'calypso-backups' ) ),
		);
		$this->assertNotContains( $backups_submenu_item, $submenu[ $slug ] );
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
}
