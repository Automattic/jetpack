<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Stats_Admin\Dashboard;
/**
 * Class WP_Test_Jetpack_Admin_Menu
 */
class WP_Test_Jetpack_Admin_Menu extends WP_UnitTestCase {
	public function set_up() {
		// Create a user and set it up as current.
		$user_id = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);
		$user_id->add_cap( 'jetpack_connect_user' );
		wp_set_current_user( $user_id->ID );

		// Mock a connection
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( array( 'id', 'user_tokens' ) );
		$user_id = wp_get_current_user();
		$user_id->remove_cap( 'jetpack_connect_user' );
	}

	public function test_jetpack_admin_menu_order() {
		global $submenu;
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';
		$jetpack_react = new Jetpack_React_Page();
		$jetpack_react->jetpack_add_dashboard_sub_nav_item();
		$jetpack_react->jetpack_add_settings_sub_nav_item();

		$jetpack_stats = new Dashboard();
		$jetpack_stats::init();

		do_action( 'admin_menu' );
		if ( ! isset( $submenu['jetpack'] ) ) {
			return;
		}
		$submenu_slugs = array_column( $submenu['jetpack'], 2 );

		// Capture the positions of these submenu items.
		$stats_submenu_position     = array_search( 'stats', $submenu_slugs, true );
		$search_submenu_position    = array_search( 'jetpack-search', $submenu_slugs, true );
		$settings_submenu_position  = array_search( 'http://example.org/wp-admin/admin.php?page=jetpack#/settings', $submenu_slugs, true );
		$dashboard_submenu_position = array_search( 'http://example.org/wp-admin/admin.php?page=jetpack#/dashboard', $submenu_slugs, true );

		// Multisites do not show the My Jetpack menu item
		if ( in_array( 'my-jetpack', $submenu_slugs, true ) ) {
			$my_jetpack_submenu_position = array_search( 'my-jetpack', $submenu_slugs, true );
			$this->assertTrue( $my_jetpack_submenu_position < $stats_submenu_position, 'My Jetpack should be above Stats in the submenu order.' );
		}
		$this->assertTrue( $stats_submenu_position < $search_submenu_position, 'Stats should be above Search in the submenu order.' );
		$this->assertTrue( $search_submenu_position < $settings_submenu_position, 'Search should be above Settings in the submenu order.' );
		$this->assertTrue( $settings_submenu_position < $dashboard_submenu_position, 'Settings should be above Dashboard in the submenu order.' );
	}
}
