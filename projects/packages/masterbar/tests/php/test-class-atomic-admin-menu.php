<?php
/**
 * Tests for Atomic_Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class Test_Atomic_Admin_Menu.
 *
 * @covers Automattic\Jetpack\Masterbar\Atomic_Admin_Menu
 */
class Test_Atomic_Admin_Menu extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

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
	 * @var Atomic_Admin_Menu
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
	 *
	 * @before
	 */
	public function set_up() {
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
		static::$admin_menu = Atomic_Admin_Menu::get_instance();
		$menu               = static::$menu_data;
		$submenu            = static::$submenu_data;
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests add_browse_sites_link.
	 *
	 * @covers ::add_browse_sites_link
	 */
	public function test_add_browse_sites_link() {
		global $menu;

		// No output when executed in single site mode.
		static::$admin_menu->add_browse_sites_link();
		$this->assertArrayNotHasKey( 0, $menu );
	}

	/**
	 * Tests add_browse_sites_link.
	 *
	 * @covers ::add_browse_sites_link
	 */
	public function test_add_browse_sites_link_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Only used on multisite' );
		}

		global $menu;

		// No output when user has just one site.
		static::$admin_menu->add_browse_sites_link();
		$this->assertArrayNotHasKey( 0, $menu );

		// Give user a second site.
		update_user_option( static::$user_id, 'wpcom_site_count', 2 );

		static::$admin_menu->add_browse_sites_link();

		$browse_sites_menu_item = array(
			'Browse sites',
			'read',
			'https://wordpress.com/sites',
			'site-switcher',
			'menu-top toplevel_page_https://wordpress.com/sites',
			'toplevel_page_https://wordpress.com/sites',
			'dashicons-arrow-left-alt2',
		);
		$this->assertSame( $menu[0], $browse_sites_menu_item );

		delete_user_option( static::$user_id, 'wpcom_site_count' );
	}

	/**
	 * Tests add_new_site_link.
	 *
	 * @covers ::add_new_site_link
	 */
	public function test_add_new_site_link() {
		global $menu;

		// Set jetpack user data.
		update_user_option( static::$user_id, 'wpcom_site_count', 1 );

		static::$admin_menu->add_new_site_link();

		$new_site_menu_item = array(
			'Add New Site',
			'read',
			'https://wordpress.com/start?ref=calypso-sidebar',
			'Add New Site',
			'menu-top toplevel_page_https://wordpress.com/start?ref=calypso-sidebar',
			'toplevel_page_https://wordpress.com/start?ref=calypso-sidebar',
			'dashicons-plus-alt',
		);
		$this->assertSame( array_pop( $menu ), $new_site_menu_item );

		delete_user_option( static::$user_id, 'wpcom_site_count' );
	}

	/**
	 * Tests add_site_card_menu
	 *
	 * @covers ::add_site_card_menu
	 */
	public function test_add_site_card_menu() {
		global $menu;

		static::$admin_menu->add_site_card_menu();

		$home_url            = home_url();
		$site_card_menu_item = array(
			// phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
			'
<div class="site__info">
	<div class="site__title">' . get_option( 'blogname' ) . '</div>
	<div class="site__domain">' . static::$domain . "</div>\n\t\n</div>",
			'read',
			$home_url,
			'site-card',
			'menu-top toplevel_page_' . $home_url,
			'toplevel_page_' . $home_url,
			plugins_url( 'src/admin-menu/globe-icon.svg', dirname( __DIR__ ) ),
		);

		$this->assertEquals( $site_card_menu_item, $menu[1] );
	}

	/**
	 * Tests add_site_card_menu for Private sites
	 *
	 * @covers ::add_site_card_menu
	 */
	public function test_add_site_card_menu_private_site() {
		global $menu;

		Functions\expect( '\Private_Site\site_is_private' )
				->andReturn( true );

		static::$admin_menu->add_site_card_menu();

		$home_url            = home_url();
		$site_card_menu_item = array(
			// phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
			'
<div class="site__info">
	<div class="site__title">' . get_option( 'blogname' ) . '</div>
	<div class="site__domain">' . static::$domain . "</div>\n\t<span class=\"site__badge site__badge-private\">Private</span>\n</div>",
			'read',
			$home_url,
			'site-card',
			'menu-top toplevel_page_' . $home_url,
			'toplevel_page_' . $home_url,
			plugins_url( 'src/admin-menu/globe-icon.svg', dirname( __DIR__ ) ),
		);

		$this->assertEquals( $site_card_menu_item, $menu[1] );
	}

	/**
	 * Tests set_site_card_menu_class
	 *
	 * @covers ::set_site_card_menu_class
	 */
	public function test_set_site_card_menu_class() {
		global $menu;

		static::$admin_menu->add_site_card_menu();

		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		$this->assertStringNotContainsString( 'has-site-icon', $menu[1][4] );

		// Atomic fallback site icon counts as no site icon.
		add_filter( 'get_site_icon_url', array( $this, 'wpcomsh_site_icon_url' ) );
		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		remove_filter( 'get_site_icon_url', array( $this, 'wpcomsh_site_icon_url' ) );
		$this->assertStringNotContainsString( 'has-site-icon', $menu[1][4] );

		// Custom site icon triggers CSS class.
		add_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		remove_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$this->assertStringContainsString( 'has-site-icon', $menu[1][4] );
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
	 * Tests get_preferred_view
	 *
	 * @covers ::get_preferred_view
	 */
	public function test_get_preferred_view() {
		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'export.php' ) );
	}

	/**
	 * Tests add_upgrades_menu
	 *
	 * @covers ::add_upgrades_menu
	 */
	public function test_add_upgrades_menu() {
		global $submenu;

		static::$admin_menu->add_upgrades_menu();

		$this->assertSame( 'https://wordpress.com/plans/' . static::$domain, $submenu['paid-upgrades.php'][1][2] );
		$this->assertSame( 'https://wordpress.com/domains/manage/' . static::$domain, $submenu['paid-upgrades.php'][2][2] );

		/** This filter is already documented in modules/masterbar/admin-menu/class-atomic-admin-menu.php */
		if ( apply_filters( 'jetpack_show_wpcom_upgrades_email_menu', false ) ) {
			$this->assertSame( 'https://wordpress.com/email/' . static::$domain, $submenu['paid-upgrades.php'][3][2] );
			$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $submenu['paid-upgrades.php'][4][2] );
		} else {
			$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $submenu['paid-upgrades.php'][3][2] );
		}
	}

	/**
	 * Tests add_my_mailboxes_menu
	 *
	 * @covers ::add_my_mailboxes_menu
	 */
	public function test_add_my_mailboxes_menu() {
		global $menu;

		static::$admin_menu->add_my_mailboxes_menu();

		$this->assertSame( 'https://wordpress.com/mailboxes/' . static::$domain, $menu['4.64424'][2] );
	}

	/**
	 * Tests add_options_menu
	 *
	 * @covers ::add_options_menu
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu();
		$this->assertSame( 'https://wordpress.com/hosting-config/' . static::$domain, $submenu['options-general.php'][11][2] );
	}

	/**
	 * Tests add_users_menu
	 *
	 * @covers ::add_users_menu
	 */
	public function test_add_users_menu() {
		global $submenu;

		static::$admin_menu->add_users_menu();
		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, $submenu['users.php'][0][2] );
		$this->assertSame( 'user-new.php', $submenu['users.php'][2][2] );
		$this->assertSame( 'https://wordpress.com/subscribers/' . static::$domain, $submenu['users.php'][4][2] );
		$this->assertSame( 'https://wordpress.com/me', $submenu['users.php'][5][2] );
		$this->assertSame( 'https://wordpress.com/me/account', $submenu['users.php'][6][2] );
	}

	/**
	 * Tests remove_gutenberg_menu
	 *
	 * @covers ::remove_gutenberg_menu
	 */
	public function test_remove_gutenberg_menu() {
		global $menu;
		static::$admin_menu->remove_gutenberg_menu();

		// Gutenberg plugin menu should not be visible.
		$this->assertArrayNotHasKey( 101, $menu );
	}

	/**
	 * Tests add_plugins_menu
	 *
	 * @covers ::add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $submenu;
		'@phan-var non-empty-array $submenu';
		$this->assertSame( 'plugin-install.php', $submenu['plugins.php'][10][2] );

		if ( ! is_multisite() ) {
			static::$admin_menu->add_plugins_menu();

			// Make sure that initial menu item is hidden.
			$this->assertSame( 'hide-if-js', $submenu['plugins.php'][1][4] );
			// Make sure that the new menu item is inserted.
			$this->assertSame( 'https://wordpress.com/plugins/' . static::$domain, $submenu['plugins.php'][0][2] );
			// Make sure that Installed Plugins menu item is still in place.
			$this->assertSame( 'plugins.php', $submenu['plugins.php'][2][2] );
		}
	}

	/**
	 * Tests add_tools_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_site_monitoring_menu() {
		global $submenu;

		static::$admin_menu->add_tools_menu();
		$menu_position = 7;

		$this->assertSame( 'https://wordpress.com/site-monitoring/' . static::$domain, $submenu['tools.php'][ $menu_position ][2] );
	}

	/**
	 * Tests add_github_deployments_menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_add_github_deployments_menu() {
		global $submenu;

		static::$admin_menu->add_tools_menu();
		$links = wp_list_pluck( array_values( $submenu['tools.php'] ), 2 );

		$this->assertContains( 'https://wordpress.com/github-deployments/' . static::$domain, $links );
	}

	/**
	 * Tests add_jetpack_scan_menu
	 *
	 * @covers ::add_jetpack_menu
	 */
	public function test_add_jetpack_scan_submenu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();
		$links = wp_list_pluck( array_values( $submenu['jetpack'] ), 2 );

		$this->assertContains( 'https://wordpress.com/scan/history/' . static::$domain, $links );
	}
}
