<?php
/**
 * Tests for Atomic_Admin_Menu class.
 *
 * @phan-file-suppress PhanDeprecatedFunction -- Ok for deprecated code to call other deprecated code.
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

		$this->setExpectedDeprecated( 'Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::__construct' );
		// Initialize in setUp so it registers hooks for every test.
		$instances = new \ReflectionProperty( 'Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu', 'instances' );
		$instances->setAccessible( true );
		$instances->setValue( null, null );
		static::$admin_menu = Atomic_Admin_Menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Tests add_new_site_link.
	 *
	 * @covers ::add_new_site_link
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_new_site_link
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_site_card_menu
	 */
	public function test_add_site_card_menu() {
		if ( ! function_exists( 'site_is_private' ) ) {
			function site_is_private() { // phpcs:ignore
				return false;
			}
		}
		static::$admin_menu->add_site_card_menu();
	}

	/**
	 * Tests set_site_card_menu_class
	 *
	 * @covers ::set_site_card_menu_class
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_site_card_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::set_site_card_menu_class
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
	 */
	public function test_get_preferred_view() {
		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'export.php' ) );
	}

	/**
	 * Tests add_upgrades_menu
	 *
	 * @covers ::add_upgrades_menu
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_upgrades_menu
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_options_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_users_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::remove_gutenberg_menu
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

		if ( ! is_multisite() && ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC ) ) {
			$this->setexpectedDeprecated( 'Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_plugins_menu' );
			$this->setexpectedDeprecated( 'Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view' );
			static::$admin_menu->add_plugins_menu();

			// Make sure that initial menu item is hidden.
			$this->assertSame( 'hide-if-js', $submenu['plugins.php'][1][4] ?? null );
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_tools_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_tools_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
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
	 *
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::add_jetpack_menu
	 * @expectedDeprecated Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu::get_preferred_view
	 */
	public function test_add_jetpack_scan_submenu() {
		global $submenu;

		static::$admin_menu->add_jetpack_menu();
		$links = wp_list_pluck( array_values( $submenu['jetpack'] ), 2 );

		$this->assertContains( 'https://wordpress.com/scan/history/' . static::$domain, $links );
	}
}
