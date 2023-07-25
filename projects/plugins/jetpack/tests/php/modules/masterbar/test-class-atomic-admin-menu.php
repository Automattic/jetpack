<?php
/**
 * Tests for Atomic_Admin_Menu class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu;
use Automattic\Jetpack\Status;

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-atomic-admin-menu.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/modules/masterbar/data/admin-menu.php';

/**
 * Class Test_Atomic_Admin_Menu.
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu
 */
class Test_Atomic_Admin_Menu extends WP_UnitTestCase {

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
	 * Create shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$domain       = ( new Status() )->get_site_suffix();
		static::$user_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$menu_data    = get_wpcom_menu_fixture();
		static::$submenu_data = get_submenu_fixture();
	}

	/**
	 * Set up data.
	 */
	public function set_up() {
		parent::set_up();
		global $menu, $submenu;

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = Atomic_Admin_Menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		wp_set_current_user( static::$user_id );
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

		if ( ! function_exists( 'site_is_private' ) ) {
			function site_is_private() { // phpcs:ignore
				return false;
			}
		}
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
			plugins_url( 'modules/masterbar/admin-menu/globe-icon.svg', JETPACK__PLUGIN_FILE ),
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

		if ( ! function_exists( 'site_is_private' ) ) {
			function site_is_private() { // phpcs:ignore
				return false;
			}
		}

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
	 * Tests add_inbox_menu
	 *
	 * @covers ::add_inbox_menu
	 */
	public function test_add_inbox_menu() {
		global $menu;

		static::$admin_menu->add_inbox_menu();

		$this->assertSame( 'https://wordpress.com/inbox/' . static::$domain, $menu['4.64424'][2] );
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
		$menu_position = 6;
		if ( is_multisite() ) {
			$menu_position = 5;
		}

		$this->assertSame( 'https://wordpress.com/subscribers/' . static::$domain, $submenu['users.php'][ $menu_position ][2] );
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
	 * Tests the filter for adding the Site Logs menu
	 *
	 * @covers ::add_tools_menu
	 */
	public function test_site_logs_menu_filter() {
		global $submenu;

		add_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_false', 99 );
		static::$admin_menu->add_tools_menu();
		remove_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_false', 99 );

		$links = wp_list_pluck( array_values( $submenu['tools.php'] ), 2 );

		$this->assertNotContains( 'https://wordpress.com/site-logs/' . static::$domain, $links );

		add_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_true', 99 );
		static::$admin_menu->add_tools_menu();
		remove_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_true', 99 );

		$links = wp_list_pluck( array_values( $submenu['tools.php'] ), 2 );

		$this->assertContains( 'https://wordpress.com/site-logs/' . static::$domain, $links );
	}
}
