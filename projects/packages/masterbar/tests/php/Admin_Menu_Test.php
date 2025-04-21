<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class Admin_Menu_Test
 *
 * @covers Automattic\Jetpack\Masterbar\Admin_Menu
 */
class Admin_Menu_Test extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;

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
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $menu, $submenu;

		static::$domain       = ( new Status() )->get_site_suffix();
		static::$menu_data    = get_menu_fixture();
		static::$submenu_data = get_submenu_fixture();

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		// Initialize in set_up so it registers hooks for every test.
		static::$admin_menu = Admin_Menu::get_instance();
		$menu               = static::$menu_data;
		$submenu            = static::$submenu_data;
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Test_Admin_Menu.
	 */
	public function test_admin_menu_output() {
		global $menu, $submenu;

		static::$admin_menu->reregister_menu_items();

		$this->assertCount( 18, $menu, 'Admin menu should not have unexpected top menu items.' );

		$this->assertEquals( static::$submenu_data[''], $submenu[''], 'Submenu items without parent should stay the same.' );
	}

	/**
	 * Tests get_preferred_view
	 */
	public function test_get_preferred_view() {
		static::$admin_menu->set_preferred_view( 'users.php', 'unknown' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'users.php' ) );
		static::$admin_menu->set_preferred_view( 'options-general.php', 'unknown' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'options-general.php' ) );
	}

	/**
	 * Tests add_my_home_menu
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
		'@phan-var non-empty-array $submenu';
		$this->assertSame( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['index.php'][0][4] );
	}

	/**
	 * Tests add_stats_menu
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
	 */
	public function test_add_posts_menu() {
		global $submenu;

		static::$admin_menu->add_posts_menu();
		$this->assertSame( 'https://wordpress.com/posts/' . static::$domain, $submenu['edit.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/post/' . static::$domain, $submenu['edit.php'][2][2] );
	}

	/**
	 * Tests add_media_menu
	 */
	public function test_add_media_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_media_menu();

		$this->assertSame( 'https://wordpress.com/media/' . static::$domain, $menu[10][2] );
		$this->assertFalse( static::$admin_menu->has_visible_items( $submenu['upload.php'] ) );
	}

	/**
	 * Tests add_page_menu
	 */
	public function test_add_page_menu() {
		global $submenu;

		static::$admin_menu->add_page_menu();
		$this->assertSame( 'https://wordpress.com/pages/' . static::$domain, $submenu['edit.php?post_type=page'][0][2] );
		$this->assertSame( 'https://wordpress.com/page/' . static::$domain, $submenu['edit.php?post_type=page'][2][2] );
	}

	/**
	 * Tests add_custom_post_type_menu
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
	 */
	public function test_add_comments_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_comments_menu();

		$this->assertSame( 'https://wordpress.com/comments/all/' . static::$domain, $menu[25][2] );
		$this->assertFalse( self::$admin_menu->has_visible_items( $submenu['edit-comments.php'] ) );
	}

	/**
	 * Tests add_appearance_menu
	 */
	public function test_add_appearance_menu() {
		global $submenu;

		static::$admin_menu->add_appearance_menu();

		$this->assertSame( 'https://wordpress.com/themes/' . static::$domain, array_shift( $submenu['themes.php'] )[2] );
	}

	/**
	 * Tests add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $menu, $submenu;

		static::$admin_menu->add_plugins_menu();

		$this->assertSame( 'https://wordpress.com/plugins/' . static::$domain, $menu[65][2] );
		$this->assertFalse( self::$admin_menu->has_visible_items( $submenu['plugins.php'] ) );
	}

	/**
	 * Tests add_users_menu
	 */
	public function test_add_users_menu() {
		global $menu, $submenu;

		// Current user can't list users.
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $editor_id );
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

		'@phan-var non-empty-array $submenu';
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
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu();

		$this->assertSame( 'https://wordpress.com/settings/general/' . static::$domain, $submenu['options-general.php'][0][2] );
	}

	/**
	 * Tests add_jetpack_menu
	 * §
	 */
	public function test_add_jetpack_menu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();

		$this->assertSame( 'https://wordpress.com/activity-log/' . static::$domain, $submenu['jetpack'][3][2] );
		$this->assertSame( 'https://wordpress.com/backup/' . static::$domain, $submenu['jetpack'][4][2] );
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

		'@phan-var non-empty-array $submenu';

		static::$admin_menu->sort_hidden_submenus();
		$this->assertNotEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][0][4] );
		$this->assertNotEquals( Base_Admin_Menu::HIDE_CSS_CLASS, $submenu['options-general.php'][2][4] );

		$this->assertEquals( array( '', 'read', 'test-slug', '' ), $submenu['options-general.php'][3] );

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
	public static function hide_menu_based_on_submenu_provider() {
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
			array(
				array(
					array( '', 'read', 'test-empty-submenu', '', '' ),
				),
				array(
					'test-empty-submenu' => array(),
				),
				array( '', 'read', 'test-empty-submenu', '', '' ),
			),
		);
	}

	/**
	 * Tests test_add_woocommerce_installation_menu
	 */
	public function test_add_woocommerce_installation_menu() {
		global $menu;

		$woo_icon = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDg1LjkgNDcuNiI+CjxwYXRoIGZpbGw9IiNhMmFhYjIiIGQ9Ik03Ny40LDAuMWMtNC4zLDAtNy4xLDEuNC05LjYsNi4xTDU2LjQsMjcuN1Y4LjZjMC01LjctMi43LTguNS03LjctOC41cy03LjEsMS43LTkuNiw2LjVMMjguMywyNy43VjguOAoJYzAtNi4xLTIuNS04LjctOC42LTguN0g3LjNDMi42LDAuMSwwLDIuMywwLDYuM3MyLjUsNi40LDcuMSw2LjRoNS4xdjI0LjFjMCw2LjgsNC42LDEwLjgsMTEuMiwxMC44UzMzLDQ1LDM2LjMsMzguOWw3LjItMTMuNXYxMS40CgljMCw2LjcsNC40LDEwLjgsMTEuMSwxMC44czkuMi0yLjMsMTMtOC43bDE2LjYtMjhjMy42LTYuMSwxLjEtMTAuOC02LjktMTAuOEM3Ny4zLDAuMSw3Ny4zLDAuMSw3Ny40LDAuMXoiLz4KPC9zdmc+Cg==';

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
