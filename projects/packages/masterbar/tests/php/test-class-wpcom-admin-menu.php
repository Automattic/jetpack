<?php
/**
 * Tests for WPcom_Admin_Menu class.
 *
 * @package jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class Test_WPcom_Admin_Menu.
 *
 * @covers Automattic\Jetpack\Dashboard_Customizations\WPcom_Admin_Menu
 */
class Test_WPcom_Admin_Menu extends TestCase {

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
	 * @var WPcom_Admin_Menu
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
		static::$menu_data    = get_wpcom_menu_fixture();
		static::$submenu_data = get_submenu_fixture();

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		$admin_menu = $this->getMockBuilder( WPcom_Admin_Menu::class )
							->disableOriginalConstructor()
							->onlyMethods( array( 'should_link_to_wp_admin' ) )
							->getMock();
		$admin_menu->method( 'should_link_to_wp_admin' )->willReturn( false );

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = $admin_menu::get_instance();

		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;
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
	 * Tests get_preferred_view
	 */
	public function test_get_preferred_view() {
		static::$admin_menu->set_preferred_view( 'themes.php', 'unknown' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'themes.php' ) );
		static::$admin_menu->set_preferred_view( 'plugins.php', 'classic' );
		$this->assertSame( 'default', static::$admin_menu->get_preferred_view( 'plugins.php' ) );
	}

	/**
	 * Tests add_new_site_link.
	 */
	public function test_add_new_site_link() {
		global $menu;

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
	}

	/**
	 * Tests add_site_card_menu
	 */
	public function test_add_site_card_menu() {
		global $menu;

		if ( ! static::$is_wpcom ) {
			$this->markTestSkipped( 'Only used on WP.com.' );
		}

		static::$admin_menu->add_site_card_menu();

		$home_url            = home_url();
		$site_card_menu_item = array(
			// phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
			'
<div class="site__info">
	<div class="site__title">' . get_option( 'blogname' ) . '</div>
	<div class="site__domain">' . static::$domain . '</div>

</div>',
			'read',
			$home_url,
			'site-card',
			'menu-top toplevel_page_' . $home_url,
			'toplevel_page_' . $home_url,
			plugins_url( 'src/admin-menu/globe-icon.svg', dirname( __DIR__ ) ),
		);

		$this->assertEquals( $menu[1], $site_card_menu_item );
	}

	/**
	 * Tests set_site_card_menu_class
	 */
	public function test_set_site_card_menu_class() {
		global $menu;

		if ( ! static::$is_wpcom ) {
			$this->markTestSkipped( 'Only used on WP.com.' );
		}

		static::$admin_menu->add_site_card_menu();

		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		$this->assertStringNotContainsString( 'has-site-icon', $menu[1][4] );

		// Custom site icon triggers CSS class.
		add_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$menu = static::$admin_menu->set_site_card_menu_class( $menu );
		remove_filter( 'get_site_icon_url', array( $this, 'custom_site_icon_url' ) );
		$this->assertStringContainsString( 'has-site-icon', $menu[1][4] );
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
	 * Tests add_upgrades_menu
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
	 */
	public function test_add_my_mailboxes_menu() {
		global $menu;

		static::$admin_menu->add_my_mailboxes_menu();

		$this->assertSame( 'https://wordpress.com/mailboxes/' . static::$domain, $menu['4.64424'][2] );
	}

	/**
	 * Tests add_users_menu
	 */
	public function test_add_users_menu() {
		global $submenu;

		// Check that menu always links to Calypso when no preferred view has been set.
		static::$admin_menu->set_preferred_view( 'users.php', 'unknown' );
		static::$admin_menu->add_users_menu();
		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, array_shift( $submenu['users.php'] )[2] );
		$this->assertSame( 'https://wordpress.com/subscribers/' . static::$domain, $submenu['users.php'][2][2] );
	}

	/**
	 * Tests add_options_menu
	 */
	public function test_add_options_menu() {
		global $submenu;

		static::$admin_menu->add_options_menu();
		'@phan-var array $submenu';
		$this->assertSame( 'https://wordpress.com/hosting-config/' . static::$domain, $submenu['options-general.php'][10][2] );
	}

	/**
	 * Tests remove_gutenberg_menu
	 */
	public function test_remove_gutenberg_menu() {
		global $menu;
		static::$admin_menu->remove_gutenberg_menu();

		// Gutenberg plugin menu should not be visible.
		$this->assertArrayNotHasKey( 101, $menu );
	}
}
