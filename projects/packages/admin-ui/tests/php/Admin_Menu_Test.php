<?php
/**
 * Admin_Menu functionality testing.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Connection Manager functionality testing.
 */
class Admin_Menu_Test extends TestCase {

	/**
	 * Administrator user ID created once for the test class.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Editor user ID created once for the test class.
	 *
	 * @var int
	 */
	private static $editor_user_id;

	/**
	 * Create shared users once for the test class.
	 *
	 * @return void
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		self::$admin_user_id = wp_insert_user(
			array(
				'user_login' => 'upgrade_test_admin',
				'user_pass'  => 'pass',
				'user_email' => 'upgrade_admin@example.com',
				'role'       => 'administrator',
			)
		);

		self::$editor_user_id = wp_insert_user(
			array(
				'user_login' => 'upgrade_test_editor',
				'user_pass'  => 'pass',
				'user_email' => 'upgrade_editor@example.com',
				'role'       => 'editor',
			)
		);
	}

	/**
	 * Reset shared state before each test.
	 *
	 * @return void
	 */
	public function setUp(): void {
		parent::setUp();
		global $submenu;
		$submenu = array();
		delete_option( 'jetpack_active_plan' );
	}

	/**
	 * Tests whether the page_suffix we return in our method will match the page_suffix returned by the native WP methods
	 *
	 * The idea of this test is to make sure our returned value for the page suffix always matches the value that will be returned
	 * by WP core when the submenu is added.
	 *
	 * @param string $menu_slug The slug of the menu being added.
	 *
	 * @dataProvider page_suffix_matches_data
	 */
	#[DataProvider( 'page_suffix_matches_data' )]
	public function test_page_suffix_matches( $menu_slug ) {

		static $top_registered = false;

		if ( ! $top_registered ) {
			$top_registered = true;
			add_menu_page(
				'Jetpack',
				'Jetpack',
				'edit_posts',
				'jetpack',
				'__return_null',
				'div',
				3
			);

			$user_id = wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'user_email' => 'admin@admin.com',
					'role'       => 'administrator',
				)
			);

			wp_set_current_user( $user_id );

		}

		$our_suffix = Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', $menu_slug, '__return_null' );
		$wp_suffix  = add_submenu_page( 'jetpack', 'Test', 'Test', 'edit_posts', $menu_slug, '__return_null' );

		$this->assertSame( $our_suffix, $wp_suffix );
	}

	/**
	 * Data provider for test_page_suffix_matches
	 *
	 * @return array
	 */
	public static function page_suffix_matches_data() {
		return array(
			'simple_string' => array( 'testmenu' ),
			'dashes'        => array( 'test-menu' ),
			'underscores'   => array( 'test_menu' ),
			'numbers'       => array( 'test_menu312' ),
			'special_chars' => array( 'test_menu#ç!&' ),
		);
	}

	/**
	 * Tests that the first registered menu item is returned correctly.
	 *
	 * @return void
	 */
	public function test_first_menu() {
		Admin_Menu::init();
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_1', '__return_null', 3 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_2', '__return_null', 1 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_3', '__return_null', 4 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_4', '__return_null', 5 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_5', '__return_null', 6 );

		do_action( 'admin_menu' );

		$first = Admin_Menu::get_top_level_menu_item_slug();

		$this->assertSame( 'menu_2', $first );
	}

	/**
	 * Upgrade item appears in the submenu for an administrator on a free plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_shown_for_free_plan_admin() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemPresent();
	}

	/**
	 * Upgrade item is absent when the site has a paid plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_paid_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option( 'jetpack_active_plan', array( 'class' => 'security' ) );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent for users without manage_options capability.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_non_admin() {
		wp_set_current_user( self::$editor_user_id );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * CSS styles are output for a free-plan admin on a Jetpack screen.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_output_for_free_plan() {
		wp_set_current_user( self::$admin_user_id );
		set_current_screen( 'jetpack' );

		ob_start();
		Admin_Menu::add_upgrade_menu_item_styles();
		$output = ob_get_clean();

		set_current_screen( 'front' );

		$this->assertStringContainsString( 'jetpack-upgrade-menu__icon', $output );
		$this->assertStringContainsString( '#069e08', $output );
	}

	/**
	 * No CSS output when the site has a paid plan, even on a Jetpack screen.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_no_output_for_paid_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option( 'jetpack_active_plan', array( 'class' => 'premium' ) );
		set_current_screen( 'jetpack' );

		ob_start();
		Admin_Menu::add_upgrade_menu_item_styles();
		$output = ob_get_clean();

		set_current_screen( 'front' );

		$this->assertSame( '', $output );
	}

	/**
	 * No CSS output when viewing a non-Jetpack admin screen, even on a free plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_no_output_outside_jetpack_screens() {
		wp_set_current_user( self::$admin_user_id );
		set_current_screen( 'dashboard' );

		ob_start();
		Admin_Menu::add_upgrade_menu_item_styles();
		$output = ob_get_clean();

		set_current_screen( 'front' );

		$this->assertSame( '', $output );
	}

	/**
	 * Asserts the upgrade submenu item is present under the jetpack top-level menu.
	 *
	 * @return void
	 */
	private function assertUpgradeMenuItemPresent() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );
		$found = array_filter(
			$slugs,
			function ( $slug ) {
				return false !== strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
			}
		);
		$this->assertNotEmpty( $found, 'Expected the upgrade menu item to be registered.' );
	}

	/**
	 * Asserts the upgrade submenu item is absent from the jetpack top-level menu.
	 *
	 * @return void
	 */
	private function assertUpgradeMenuItemAbsent() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );
		$found = array_filter(
			$slugs,
			function ( $slug ) {
				return false !== strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
			}
		);
		$this->assertEmpty( $found, 'Expected the upgrade menu item to be absent.' );
	}
}
