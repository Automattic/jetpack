<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Admin_Menu;
use Automattic\Jetpack\Dashboard_Customizations\Base_Admin_Menu;
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
	public function set_up() {
		parent::set_up();
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

		$this->assertCount( 18, $menu, 'Admin menu should not have unexpected top menu items.' );

		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );
	}

	/**
	 * Tests get_preferred_view
	 *
	 * @covers ::get_preferred_view
	 */
	public function test_get_preferred_view() {
		static::$admin_menu->set_preferred_view( 'users.php', 'unknown' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'users.php' ) );
		static::$admin_menu->set_preferred_view( 'options-general.php', 'unknown' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'options-general.php' ) );
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
		$this->assertSame( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['index.php'][0][4] );
	}

	/**
	 * Tests add_stats_menu
	 *
	 * @covers ::add_stats_menu
	 */
	public function test_add_stats_menu() {
		global $menu;

		static::$admin_menu->add_stats_menu();

		// Ignore position keys, since the key used for the Stats menu contains a pseudorandom number
		// that we shouldn't hardcode. The only thing that matters is that the menu should be in the
		// 3rd position regardless of the key.
		// @see https://core.trac.wordpress.org/ticket/40927
		ksort( $menu );
		$menu_items = array_values( $menu );

		$this->assertSame( 'https://wordpress.com/stats/day/' . static::$domain, $menu_items[2][2] );
	}

	/**
	 * Tests add_upgrades_menu
	 *
	 * @covers ::add_upgrades_menu
	 */
	public function test_add_upgrades_menu() {
		global $submenu;

		static::$admin_menu->add_upgrades_menu( 'Test Plan' );

		$this->assertSame( 'Upgrades<span class="inline-text" style="display:none">Test Plan</span>', $submenu['paid-upgrades.php'][0][0] );
		$this->assertSame( 'https://wordpress.com/plans/' . static::$domain, $submenu['paid-upgrades.php'][1][2] );
		$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $submenu['paid-upgrades.php'][2][2] );
	}

	/**
	 * Tests add_posts_menu
	 *
	 * @covers ::add_posts_menu
	 */
	public function test_add_posts_menu() {
		global $submenu;

		static::$admin_menu->add_posts_menu();

		$this->assertSame( 'https://wordpress.com/posts/' . static::$domain, $submenu['edit.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/post/' . static::$domain, $submenu['edit.php'][2][2] );
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
		$this->assertFalse( static::$admin_menu->has_visible_items( $submenu['upload.php'] ) );
	}

	/**
	 * Tests add_page_menu
	 *
	 * @covers ::add_page_menu
	 */
	public function test_add_page_menu() {
		global $submenu;

		static::$admin_menu->add_page_menu();

		$this->assertSame( 'https://wordpress.com/pages/' . static::$domain, $submenu['edit.php?post_type=page'][0][2] );
		$this->assertSame( 'https://wordpress.com/page/' . static::$domain, $submenu['edit.php?post_type=page'][2][2] );
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

		$this->assertSame( 'https://wordpress.com/types/custom_test_type/' . static::$domain, $submenu['edit.php?post_type=custom_test_type'][0][2] );
		$this->assertSame( 'https://wordpress.com/edit/custom_test_type/' . static::$domain, $submenu['edit.php?post_type=custom_test_type'][2][2] );
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
		$this->assertFalse( self::$admin_menu->has_visible_items( $submenu['edit-comments.php'] ) );
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
		$this->assertFalse( self::$admin_menu->has_visible_items( $submenu['plugins.php'] ) );
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

		$this->assertSame( 'https://wordpress.com/me', $submenu['profile.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/me/account', $submenu['profile.php'][2][2] );

		// Reset.
		wp_set_current_user( static::$user_id );
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		// On multisite the administrator is not allowed to create users.
		grant_super_admin( self::$user_id );
		$account_key = 5;

		static::$admin_menu->add_users_menu();

		// On WP.com users can only invite other users, not create them (missing create_users cap).
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$this->assertSame( 'https://wordpress.com/people/new/' . static::$domain, $submenu['users.php'][2][2] );
			$account_key = 6;
		}

		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, $submenu['users.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/me', $submenu['users.php'][3][2] );
		$this->assertSame( 'https://wordpress.com/me/account', $submenu['users.php'][ $account_key ][2] );
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_tools_menu() {
		global $submenu;

		static::$admin_menu->add_tools_menu();

		$this->assertSame( 'https://wordpress.com/marketing/tools/' . static::$domain, $submenu['tools.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/earn/' . static::$domain, $submenu['tools.php'][1][2] );
		$this->assertSame( 'https://wordpress.com/import/' . static::$domain, $submenu['tools.php'][4][2] );
		$this->assertSame( 'https://wordpress.com/export/' . static::$domain, $submenu['tools.php'][5][2] );
	}

	/**
	 * Tests add_options_menu
	 *
	 * @covers ::add_options_menu
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu();

		$this->assertSame( 'https://wordpress.com/settings/general/' . static::$domain, $submenu['options-general.php'][0][2] );
	}

	/**
	 * Tests add_jetpack_menu
	 * §
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function test_add_jetpack_menu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();

		$this->assertSame( 'https://wordpress.com/activity-log/' . static::$domain, $submenu['jetpack'][3][2] );
		$this->assertSame( 'https://wordpress.com/backup/' . static::$domain, $submenu['jetpack'][4][2] );
	}

	/**
	 * Tests add_gutenberg_menus
	 *
	 * @covers ::add_gutenberg_menus
	 */
	public function test_add_gutenberg_menus() {
		global $menu;
		static::$admin_menu->add_gutenberg_menus();

		// FSE is no longer where it was put by default.
		$this->assertArrayNotHasKey( 100, $menu );
		$this->assertArrayHasKey( 59, $menu );

		$fse_link = 'https://wordpress.com/site-editor/' . static::$domain;
		$fse_menu = array(
			'Site Editor <span class="awaiting-mod">beta</span>',
			'edit_theme_options',
			$fse_link,
			'Site Editor (beta)',
			'menu-top toplevel_page_gutenberg-edit-site',
			'toplevel_page_gutenberg-edit-site',
			'dashicons-layout',
		);
		$this->assertSame( $menu[59], $fse_menu );
	}

	/**
	 * Check if the hidden menus are at the end of the submenu.
	 */
	public function test_if_the_hidden_menus_are_at_the_end_of_submenu() {
		global $submenu;

		$submenu = array(
			'options-general.php' => array(
				array( '', 'read', 'test-slug', '', '' ),
				array( '', 'read', 'test-slug', '', Base_Admin_Menu::HIDE_CSS_CLASS ),
				array( '', 'read', 'test-slug', '', '' ),
				array( '', 'read', 'test-slug', '' ),
				array( '', 'read', 'test-slug', '', Base_Admin_Menu::HIDE_CSS_CLASS ),
				array( '', 'read', 'test-slug', '', '' ),
			),
		);

		static::$admin_menu->sort_hidden_submenus();
		$this->assertNotEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][0][4] );
		$this->assertNotEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][2][4] );

		$this->assertEquals( $submenu['options-general.php'][3], array( '', 'read', 'test-slug', '' ) );

		$this->assertNotEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][5][4] );

		$this->assertEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][6][4] );
		$this->assertEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][7][4] );

		$submenu = self::$submenu_data;
	}

	/**
	 * Check if the parent menu is hidden when the submenus are hidden.
	 *
	 * @dataProvider hide_menu_based_on_submenu_provider
	 *
	 * @param array $menu_items The mock menu array.
	 * @param array $submenu_items The mock submenu array.
	 * @param array $expected The expected result.
	 */
	public function test_if_it_hides_menu_based_on_submenu( $menu_items, $submenu_items, $expected ) {
		global $submenu, $menu;

		$menu    = $menu_items;
		$submenu = $submenu_items;

		static::$admin_menu->hide_parent_of_hidden_submenus();

		$this->assertEquals( $expected, $menu[0] );

		// reset the menu arrays.
		$menu    = self::$menu_data;
		$submenu = self::$submenu_data;
	}

	/**
	 * The data provider for test_if_it_hides_menu_based_on_submenu.
	 *
	 * @return array
	 */
	public function hide_menu_based_on_submenu_provider() {
		return array(
			array(
				array(
					array( '', 'non-existing-capability', 'test-slug', '', '' ),
				),
				array(
					'test-slug' => array(
						array(
							'test',
							'',
							'',
							'',
							Base_Admin_Menu::HIDE_CSS_CLASS,
						),
					),
				),
				array( '', 'non-existing-capability', 'test-slug', '', Base_Admin_Menu::HIDE_CSS_CLASS ),
			),
			array(
				array(
					array( '', 'read', 'test-slug', '', '' ),
				),
				array(
					'test-slug' => array(
						array(
							'test',
							'',
							'test-slug',
							'',
							Base_Admin_Menu::HIDE_CSS_CLASS,
						),
					),
				),
				array( '', 'read', 'test-slug', '', Base_Admin_Menu::HIDE_CSS_CLASS ),
			),
		);
	}

	/**
	 * Tests test_add_woocommerce_installation_menu
	 *
	 * @covers ::test_add_woocommerce_installation_menu
	 */
	public function test_add_woocommerce_installation_menu() {
		global $menu;

		$woo_icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxwYXRoIGZpbGw9IiNhMmFhYjIiIGQ9Ik02MTIuMTkyIDQyNi4zMzZjMC02Ljg5Ni0zLjEzNi01MS42LTI4LTUxLjYtMzcuMzYgMC00Ni43MDQgNzIuMjU2LTQ2LjcwNCA4Mi42MjQgMCAzLjQwOCAzLjE1MiA1OC40OTYgMjguMDMyIDU4LjQ5NiAzNC4xOTItLjAzMiA0Ni42NzItNzIuMjg4IDQ2LjY3Mi04OS41MnptMjAyLjE5MiAwYzAtNi44OTYtMy4xNTItNTEuNi0yOC4wMzItNTEuNi0zNy4yOCAwLTQ2LjYwOCA3Mi4yNTYtNDYuNjA4IDgyLjYyNCAwIDMuNDA4IDMuMDcyIDU4LjQ5NiAyNy45NTIgNTguNDk2IDM0LjE5Mi0uMDMyIDQ2LjY4OC03Mi4yODggNDYuNjg4LTg5LjUyek0xNDEuMjk2Ljc2OGMtNjguMjI0IDAtMTIzLjUwNCA1NS40ODgtMTIzLjUwNCAxMjMuOTJ2NjUwLjcyYzAgNjguNDMyIDU1LjI5NiAxMjMuOTIgMTIzLjUwNCAxMjMuOTJoMzM5LjgwOGwxMjMuNTA0IDEyMy45MzZWODk5LjMyOGgyNzguMDQ4YzY4LjIyNCAwIDEyMy41Mi01NS40NzIgMTIzLjUyLTEyMy45MnYtNjUwLjcyYzAtNjguNDMyLTU1LjI5Ni0xMjMuOTItMTIzLjUyLTEyMy45MmgtNzQxLjM2em01MjYuODY0IDQyMi4xNmMwIDU1LjA4OC0zMS4wODggMTU0Ljg4LTEwMi42NCAxNTQuODgtNi4yMDggMC0xOC40OTYtMy42MTYtMjUuNDI0LTYuMDE2LTMyLjUxMi0xMS4xNjgtNTAuMTkyLTQ5LjY5Ni01Mi4zNTItNjYuMjU2IDAgMC0zLjA3Mi0xNy43OTItMy4wNzItNDAuNzUyIDAtMjIuOTkyIDMuMDcyLTQ1LjMyOCAzLjA3Mi00NS4zMjggMTUuNTUyLTc1LjcyOCA0My41NTItMTA2LjczNiA5Ni40NDgtMTA2LjczNiA1OS4wNzItLjAzMiA4My45NjggNTguNTI4IDgzLjk2OCAxMTAuMjA4ek00ODYuNDk2IDMwMi40YzAgMy4zOTItNDMuNTUyIDE0MS4xNjgtNDMuNTUyIDIxMy40MjR2NzUuNzEyYy0yLjU5MiAxMi4wOC00LjE2IDI0LjE0NC0yMS44MjQgMjQuMTQ0LTQ2LjYwOCAwLTg4Ljg4LTE1MS40NzItOTIuMDE2LTE2MS44NC02LjIwOCA2Ljg5Ni02Mi4yNCAxNjEuODQtOTYuNDQ4IDE2MS44NC0yNC44NjQgMC00My41NTItMTEzLjY0OC00Ni42MDgtMTIzLjkzNkMxNzYuNzA0IDQzNi42NzIgMTYwIDMzNC4yMjQgMTYwIDMyNy4zMjhjMC0yMC42NzIgMS4xNTItMzguNzM2IDI2LjA0OC0zOC43MzYgNi4yMDggMCAyMS42IDYuMDY0IDIzLjcxMiAxNy4xNjggMTEuNjQ4IDYyLjAzMiAxNi42ODggMTIwLjUxMiAyOS4xNjggMTg1Ljk2OCAxLjg1NiAyLjkyOCAxLjUwNCA3LjAwOCA0LjU2IDEwLjQzMiAzLjE1Mi0xMC4yODggNjYuOTI4LTE2OC43ODQgOTQuOTYtMTY4Ljc4NCAyMi41NDQgMCAzMC40IDQ0LjU5MiAzMy41MzYgNjEuODI0IDYuMjA4IDIwLjY1NiAxMy4wODggNTUuMjE2IDIyLjQxNiA4Mi43NTIgMC0xMy43NzYgMTIuNDgtMjAzLjEyIDY1LjM5Mi0yMDMuMTIgMTguNTkyLjAzMiAyNi43MDQgNi45MjggMjYuNzA0IDI3LjU2OHpNODcwLjMyIDQyMi45MjhjMCA1NS4wODgtMzEuMDg4IDE1NC44OC0xMDIuNjQgMTU0Ljg4LTYuMTkyIDAtMTguNDQ4LTMuNjE2LTI1LjQyNC02LjAxNi0zMi40MzItMTEuMTY4LTUwLjE3Ni00OS42OTYtNTIuMjg4LTY2LjI1NiAwIDAtMy44ODgtMTcuOTItMy44ODgtNDAuODk2czMuODg4LTQ1LjE4NCAzLjg4OC00NS4xODRjMTUuNTUyLTc1LjcyOCA0My40ODgtMTA2LjczNiA5Ni4zODQtMTA2LjczNiA1OS4xMDQtLjAzMiA4My45NjggNTguNTI4IDgzLjk2OCAxMTAuMjA4eiIvPjwvc3ZnPg==';

		// By default, the WooCommerce installation menu item should NOT be displayed.
		static::$admin_menu->add_woocommerce_installation_menu();

		$this->assertArrayNotHasKey( 54, $menu );
		$this->assertArrayNotHasKey( 55, $menu );

		// Reset the menu array.
		$menu = self::$menu_data;

		// If the filter returns true, the WooCommerce installation menu should be displayed.
		add_filter( 'jetpack_show_wpcom_woocommerce_installation_menu', '__return_true' );
		static::$admin_menu->add_woocommerce_installation_menu();

		$this->assertArrayHasKey( 54, $menu );
		$this->assertArrayHasKey( 55, $menu );

		$this->assertMatchesRegularExpression( '/^separator-custom-.*/', $menu['54'][2] );

		$this->assertSame( 'WooCommerce', $menu[55][0] );
		$this->assertSame( 'activate_plugins', $menu[55][1] );
		$this->assertSame( 'https://wordpress.com/woocommerce-installation/' . static::$domain, $menu[55][2] );
		$this->assertSame( 'WooCommerce', $menu[55][3] );
		$this->assertSame( $woo_icon, $menu[55][6] );

		remove_all_filters( 'jetpack_show_wpcom_woocommerce_installation_menu' );

		// Reset the menu array.
		$menu = self::$menu_data;

		// If the filter returns false, the WooCommerce installation menu should NOT be displayed.
		add_filter( 'jetpack_show_wpcom_woocommerce_installation_menu', '__return_false' );
		static::$admin_menu->add_woocommerce_installation_menu();

		$this->assertArrayNotHasKey( 54, $menu );
		$this->assertArrayNotHasKey( 55, $menu );

		remove_all_filters( 'jetpack_show_wpcom_woocommerce_installation_menu' );

		// Reset the menu array.
		$menu = self::$menu_data;

		// Test filter signature with $current_plan passed in.
		add_filter(
			'jetpack_show_wpcom_woocommerce_installation_menu',
			function ( $should_show, $current_plan ) {
				return $current_plan['test'];
			},
			10,
			2
		);
		static::$admin_menu->add_woocommerce_installation_menu( array( 'test' => true ) );

		$this->assertArrayHasKey( 54, $menu );
		$this->assertArrayHasKey( 55, $menu );

		remove_all_filters( 'jetpack_show_wpcom_woocommerce_installation_menu' );
	}
}
