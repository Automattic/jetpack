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
		wp_set_current_user( $user_id->ID );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $user_id->ID );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id->ID => "honey.badger.$user_id->ID" ) );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( array( 'id', 'user_tokens', 'blog_token' ) );
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
		$submenu_names = array_column( $submenu['jetpack'], 3 );

		// Capture the positions of these submenu items.
		$stats_submenu_position        = array_search( 'Stats', $submenu_names, true );
		$activity_log_submenu_position = array_search( 'Activity Log', $submenu_names, true );
		$search_submenu_position       = array_search( 'Jetpack Search', $submenu_names, true );
		$settings_submenu_position     = array_search( 'Settings', $submenu_names, true );
		$dashboard_submenu_position    = array_search( 'Dashboard', $submenu_names, true );

		// Some sites - multisites / some WoA for example - may not have these items.
		if ( in_array( 'My Jetpack', $submenu_names, true ) ) {
			$my_jetpack_submenu_position = array_search( 'My Jetpack', $submenu_names, true );
			if ( in_array( 'Stats', $submenu_names, true ) ) {
				$stats_submenu_position = array_search( 'Stats', $submenu_names, true );
				$this->assertTrue( $my_jetpack_submenu_position < $stats_submenu_position, 'My Jetpack should be above Stats in the submenu order.' );
				$this->assertTrue( $stats_submenu_position < $activity_log_submenu_position, 'Stats should be above Search in the submenu order.' );
			} else {
				$this->assertTrue( $my_jetpack_submenu_position < $activity_log_submenu_position, 'My Jetpack should be above Search in the submenu order.' );
			}
		}
		$this->assertTrue( $search_submenu_position < $settings_submenu_position, 'Search should be above Settings in the submenu order.' );
		$this->assertTrue( $settings_submenu_position < $dashboard_submenu_position, 'Settings should be above Dashboard in the submenu order.' );
	}
}
