<?php
/**
 * Tests for Domain_Only_Admin_Menu class.
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
 * Class Test_Domain_Only_Admin_Menu.
 *
 * @covers Automattic\Jetpack\Masterbar\Domain_Only_Admin_Menu
 */
class Test_Domain_Only_Admin_Menu extends TestCase {

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
	 * @var Domain_Only_Admin_Menu
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

		// Initialize in setUp so it registers hooks for every test.
		static::$admin_menu = Domain_Only_Admin_Menu::get_instance();
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
	 * Tests reregister_menu_items when email subscriptions don't exist.
	 */
	public function test_reregister_menu_items_without_email_subscriptions() {
		global $menu;

		// @phan-suppress-next-line PhanDeprecatedFunction -- Needed for PHP 7.0 and 7.1 CI tests. We can replace with onlyMethods once WP 6.7 comes out.
		$mock_email_checker = $this->getMockBuilder( WPCOM_Email_Subscription_Checker::class )->setMethods( array( 'has_email' ) )->getMock();
		$mock_email_checker->method( 'has_email' )->willReturn( false ); // always returns false

		static::$admin_menu->set_email_subscription_checker( $mock_email_checker );
		static::$admin_menu->reregister_menu_items();

		$this->assertCount( 3, $menu );

		$this->assertEquals( 'https://wordpress.com/domains/manage/' . static::$domain . '/edit/' . static::$domain, $menu[0][2] );
		$this->assertEquals( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $menu[1][2] );
		$this->assertEquals( 'https://wordpress.com/mailboxes/' . static::$domain, $menu[2][2] );
	}

	/**
	 * Tests reregister_menu_items with email subscriptions .
	 */
	public function test_reregister_menu_items_with_email_subscriptions() {
		global $menu;

		// @phan-suppress-next-line PhanDeprecatedFunction -- Needed for PHP 7.0 and 7.1 CI tests. We can replace with onlyMethods once WP 6.7 comes out.
		$mock_email_checker = $this->getMockBuilder( WPCOM_Email_Subscription_Checker::class )->setMethods( array( 'has_email' ) )->getMock();
		$mock_email_checker->method( 'has_email' )->willReturn( true ); // always returns true

		static::$admin_menu->set_email_subscription_checker( $mock_email_checker );
		static::$admin_menu->reregister_menu_items();

		$this->assertCount( 4, $menu );

		$this->assertEquals( 'https://wordpress.com/domains/manage/' . static::$domain . '/edit/' . static::$domain, $menu[0][2] );
		$this->assertEquals( 'https://wordpress.com/email/' . static::$domain . '/manage/' . static::$domain, $menu[1][2] );
		$this->assertEquals( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $menu[2][2] );
		$this->assertEquals( 'https://wordpress.com/mailboxes/' . static::$domain, $menu[3][2] );
	}
}
