<?php
/**
 * Tests for Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class Admin_Menu_Test
 *
 * @covers Automattic\Jetpack\Masterbar\Admin_Menu
 */
#[CoversClass( Admin_Menu::class )]
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

		$this->assertCount( 16, $menu, 'Admin menu should not have unexpected top menu items.' );

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

		// Reset.
		wp_set_current_user( static::$user_id );
		$menu    = static::$menu_data;
		$submenu = static::$submenu_data;

		// On multisite the administrator is not allowed to create users.
		grant_super_admin( self::$user_id );

		static::$admin_menu->add_users_menu();

		// On WP.com users can only invite other users, not create them (missing create_users cap).
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$this->assertSame( 'https://wordpress.com/people/new/' . static::$domain, $submenu['users.php'][2][2] );
		}

		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, $submenu['users.php'][0][2] );
		$this->assertSame( 'https://wordpress.com/me', $submenu['users.php'][3][2] );
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
	#[DataProvider( 'hide_menu_based_on_submenu_provider' )]
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
}
