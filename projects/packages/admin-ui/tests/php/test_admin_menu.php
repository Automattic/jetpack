<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Admin_Menu functionality testing.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\TestCase;

/**
 * Connection Manager functionality testing.
 */
class Admin_Menu_Test extends TestCase {

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
	public function test_page_suffix_matches( $menu_slug ) {

		static $top_registered = false;

		if ( ! $top_registered ) {
			$top_registered = true;
			add_menu_page(
				'Jetpack',
				'Jetpack',
				'read',
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

		$our_suffix = Admin_Menu::add_menu( 'Test', 'Test', 'read', $menu_slug, '__return_null' );
		$wp_suffix  = add_submenu_page( 'jetpack', 'Test', 'Test', 'read', $menu_slug, '__return_null' );

		$this->assertSame( $our_suffix, $wp_suffix );
	}

	/**
	 * Data provider for test_page_suffix_matches
	 *
	 * @return array
	 */
	public function page_suffix_matches_data() {
		return array(
			'simple_string' => array( 'testmenu' ),
			'dashes'        => array( 'test-menu' ),
			'underscores'   => array( 'test_menu' ),
			'numbers'       => array( 'test_menu312' ),
			'special_chars' => array( 'test_menu#ç!&' ),
		);
	}

	/**
	 * Undocumented function
	 *
	 * @return void
	 */
	public function test_first_menu() {
		Admin_Menu::init();
		Admin_Menu::add_menu( 'Test', 'Test', 'read', 'menu_1', '__return_null', 3 );
		Admin_Menu::add_menu( 'Test', 'Test', 'read', 'menu_2', '__return_null', 1 );
		Admin_Menu::add_menu( 'Test', 'Test', 'read', 'menu_3', '__return_null', 4 );
		Admin_Menu::add_menu( 'Test', 'Test', 'read', 'menu_4', '__return_null', 5 );
		Admin_Menu::add_menu( 'Test', 'Test', 'read', 'menu_5', '__return_null', 6 );

		do_action( 'admin_menu' );

		$first = Admin_Menu::get_top_level_menu_item_slug();

		$this->assertSame( 'menu_2', $first );
	}

}
