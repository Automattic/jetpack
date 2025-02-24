<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Stats_Admin\Dashboard;
use Automattic\Jetpack\VideoPress\Admin_UI;
use Automattic\Jetpack\WordAds\Dashboard as WordAdsDashboard;
/**
 * Class Jetpack_Admin_Menu_Test
 */
class Jetpack_Admin_Menu_Test extends WP_UnitTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
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
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'user_tokens' );
	}

	/**
	 * Test the order of many of the Jetpack admin menu items.
	 *
	 * @see https://github.com/Automattic/jetpack-roadmap/issues/856#issuecomment-2308599496
	 */
	public function test_jetpack_admin_menu_order() {
		global $submenu;

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';
		$jetpack_react = new Jetpack_React_Page();
		$jetpack_react->jetpack_add_dashboard_sub_nav_item();
		$jetpack_react->jetpack_add_settings_sub_nav_item();

		$jetpack_stats = new Dashboard();
		$jetpack_stats::init();

		$jetpack_video = new Admin_UI();
		$jetpack_video->init();

		$jetpack_wordads = new WordAdsDashboard();
		$jetpack_wordads->init_hooks();

		$jetpack_backup = new Jetpack_Backup();
		$jetpack_backup->initialize();

		do_action( 'admin_menu' );

		if ( ! isset( $submenu['jetpack'] ) ) {
			return;
		}

		$submenu_names = array_column( $submenu['jetpack'], 3 );
		// Capture the positions of these submenu items.
		$stats_submenu_position      = array_search( 'Stats', $submenu_names, true );
		$videopress_submenu_position = array_search( 'Jetpack VideoPress', $submenu_names, true );
		$backup_submenu_position     = array_search( 'Jetpack VaultPress Backup', $submenu_names, true );
		$search_submenu_position     = array_search( 'Jetpack Search', $submenu_names, true );
		$wordads_submenu_position    = array_search( 'WordAds Settings', $submenu_names, true );
		$settings_submenu_position   = array_search( 'Settings', $submenu_names, true );
		$dashboard_submenu_position  = array_search( 'Dashboard', $submenu_names, true );

		// Some sites - multisites / WoA for example - may not have all of the menu items.
		if ( in_array( 'My Jetpack', $submenu_names, true ) ) {
			$my_jetpack_submenu_position = array_search( 'My Jetpack', $submenu_names, true );
			$this->assertLessThan( $stats_submenu_position, $my_jetpack_submenu_position, 'My Jetpack should be above Stats in the submenu order.' );
		}

		if ( in_array( 'Activity Log', $submenu_names, true ) ) {
			$activity_log_submenu_position = array_search( 'Activity Log', $submenu_names, true );
			$this->assertLessThan( $search_submenu_position, $activity_log_submenu_position, 'Activity Log should be above Search in the submenu order.' );
			$this->assertLessThan( $activity_log_submenu_position, $backup_submenu_position, 'Jetpack VaultPress Backup should be above Activity Log in the submenu order.' );
		}
		$this->assertLessThan( $videopress_submenu_position, $stats_submenu_position, 'Stats should be above VideoPress in the submenu order.' );
		$this->assertLessThan( $backup_submenu_position, $videopress_submenu_position, 'Jetpack VideoPress should be above Jetpack VaultPress Backup in the submenu order.' );
		$this->assertLessThan( $search_submenu_position, $backup_submenu_position, 'Jetpack VaultPress Backup should be above Search in the submenu order.' );
		$this->assertLessThan( $wordads_submenu_position, $search_submenu_position, 'Search should be above WordAds in the submenu order.' );
		$this->assertLessThan( $settings_submenu_position, $wordads_submenu_position, 'WordAds should be above Settings in the submenu order.' );
		$this->assertLessThan( $dashboard_submenu_position, $settings_submenu_position, 'Settings should be above Dashboard in the submenu order.' );
	}
}
