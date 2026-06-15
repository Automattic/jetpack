<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Stats_Admin\Dashboard;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Automattic\Jetpack\VideoPress\Admin_UI;
/**
 * Class Jetpack_Admin_Menu_Test
 */
class Jetpack_Admin_Menu_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		remove_all_actions( 'load-jetpack_page_jetpack-offline-mode' );
		\Automattic\Jetpack\Admin_UI\Admin_Menu::remove_menu( 'jetpack-offline-mode' );
		StatusCache::clear();
	}

	/**
	 * Test the order of many of the Jetpack admin menu items.
	 * External links (those that open in new windows) should appear after internal links.
	 *
	 * @see https://github.com/Automattic/jetpack-roadmap/issues/856#issuecomment-2308599496
	 */
	public function test_jetpack_admin_menu_order() {
		global $submenu;

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';
		$jetpack_react = new Jetpack_React_Page();
		$jetpack_react->jetpack_add_settings_sub_nav_item();

		$jetpack_stats = new Dashboard();
		$jetpack_stats::init();

		$jetpack_video = new Admin_UI();
		$jetpack_video->init();

		$jetpack_backup = new Jetpack_Backup();
		$jetpack_backup->initialize();

		do_action( 'admin_menu' );

		if ( ! isset( $submenu['jetpack'] ) ) {
			return;
		}

		$submenu_names = array_column( $submenu['jetpack'], 3 );
		// Capture the positions of these submenu items.
		$videopress_submenu_position = array_search( 'Jetpack VideoPress', $submenu_names, true );
		$backup_submenu_position     = array_search( 'Jetpack Backup', $submenu_names, true );
		$search_submenu_position     = array_search( 'Jetpack Search', $submenu_names, true );
		$settings_submenu_position   = array_search( 'Settings', $submenu_names, true );

		// Test internal link ordering (should appear before Settings).
		$this->assertLessThan( $backup_submenu_position, $videopress_submenu_position, 'Jetpack VideoPress should be above Jetpack VaultPress Backup in the submenu order.' );
		$this->assertLessThan( $search_submenu_position, $backup_submenu_position, 'Jetpack Backup should be above Search in the submenu order.' );
		$this->assertLessThan( $settings_submenu_position, $search_submenu_position, 'Search should be above Settings in the submenu order.' );

		// Test that external links (those that open in new windows) appear after Settings.
		if ( in_array( 'Activity Log', $submenu_names, true ) ) {
			$activity_log_submenu_position = array_search( 'Activity Log', $submenu_names, true );
			$this->assertLessThan( $activity_log_submenu_position, $settings_submenu_position, 'Settings should be above Activity Log in the submenu order (external links should be last).' );
		}
	}

	/**
	 * Test Jetpack submenus are limited to offline-capable pages while Offline Mode is active.
	 */
	public function test_jetpack_submenu_is_filtered_in_offline_mode() {
		global $submenu;

		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-offline-mode-page.php';

		$jetpack_react      = new Jetpack_React_Page();
		$submenu['jetpack'] = array(
			array( 'Dashboard', 'jetpack_admin_page', 'jetpack', 'Dashboard' ),
			array( 'Offline Mode', 'manage_options', Jetpack_Offline_Mode_Page::MENU_SLUG, 'Offline Mode' ),
			array( 'Boost', 'jetpack_admin_page', 'jetpack-boost', 'Boost' ),
			array( 'Forms', 'edit_pages', 'jetpack-forms-admin', 'Jetpack Forms' ),
			array( 'Newsletter', 'manage_options', 'jetpack-newsletter', 'Newsletter' ),
			array( 'Settings', 'jetpack_admin_page', Jetpack::admin_url( array( 'page' => 'jetpack#/settings' ) ), 'Settings' ),
			array( 'VideoPress', 'manage_options', 'jetpack-videopress', 'Jetpack VideoPress' ),
			array( 'Social', 'publish_posts', 'jetpack-social', 'Jetpack Social' ),
			array( 'Protect', 'manage_options', 'jetpack-protect', 'Jetpack Protect' ),
			array( 'Akismet Anti-spam', 'manage_options', 'akismet-key-config', 'Akismet Anti-spam' ),
			array( 'Backup', 'manage_options', 'jetpack-backup', 'Jetpack Backup' ),
			array( 'Search', 'manage_options', 'jetpack-search', 'Jetpack Search' ),
			array( 'Activity Log', 'manage_options', 'https://jetpack.com/redirect/?source=cloud-activity-log-wp-menu', 'Activity Log' ),
		);

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		try {
			$jetpack_react->remove_jetpack_menu();

			$this->assertArrayHasKey( 'jetpack', $submenu );
			$submenu_titles = wp_list_pluck( $submenu['jetpack'], 3 );

			$this->assertSame(
				array(
					'Offline Mode',
					'Boost',
					'Jetpack Forms',
					'Newsletter',
					'Settings',
				),
				array_values( $submenu_titles )
			);
		} finally {
			unset( $submenu['jetpack'] );
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			StatusCache::clear();
		}
	}

	/**
	 * Test the Offline Mode page is not added when Jetpack is online.
	 */
	public function test_offline_mode_menu_item_is_not_added_when_online() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-offline-mode-page.php';

		StatusCache::clear();

		$this->assertNull( Jetpack_Offline_Mode_Page::add_menu_item() );
		$this->assertFalse(
			has_action( 'load-jetpack_page_jetpack-offline-mode', array( 'Jetpack_Offline_Mode_Page', 'admin_init' ) )
		);
	}

	/**
	 * Test the Offline Mode page is added when Jetpack is offline.
	 */
	public function test_offline_mode_menu_item_is_added_when_offline() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-offline-mode-page.php';

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		try {
			$this->assertSame( 'jetpack_page_jetpack-offline-mode', Jetpack_Offline_Mode_Page::add_menu_item() );
			$this->assertNotFalse(
				has_action( 'load-jetpack_page_jetpack-offline-mode', array( 'Jetpack_Offline_Mode_Page', 'admin_init' ) )
			);
		} finally {
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			StatusCache::clear();
		}
	}

	/**
	 * Test the Offline Mode page is the first queued Jetpack package submenu item.
	 */
	public function test_offline_mode_menu_item_uses_first_package_menu_position() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-offline-mode-page.php';

		$this->assertSame( 1, Jetpack_Offline_Mode_Page::MENU_POSITION );
	}

	/**
	 * Test the internal wp-build page slug does not intercept the wp-admin Offline Mode URL.
	 */
	public function test_offline_mode_wp_build_slug_does_not_match_menu_slug() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-offline-mode-page.php';

		$this->assertSame( 'jetpack-offline-mode', Jetpack_Offline_Mode_Page::MENU_SLUG );
		$this->assertNotSame(
			Jetpack_Offline_Mode_Page::MENU_SLUG,
			Jetpack_Offline_Mode_Page::WP_BUILD_SLUG,
			'The generated full-page wp-build slug must stay distinct from the wp-admin menu slug.'
		);
	}

	/**
	 * Test the Jetpack AI page is not available when Offline Mode is active.
	 */
	public function test_ai_menu_item_is_not_added_in_offline_mode() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';

		\Automattic\Jetpack\Admin_UI\Admin_Menu::remove_menu( 'jetpack-ai' );

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		try {
			$jetpack_ai = new Jetpack_AI_Page();
			$jetpack_ai->add_actions();

			$this->assertFalse( \Automattic\Jetpack\Admin_UI\Admin_Menu::remove_menu( 'jetpack-ai' ) );
		} finally {
			\Automattic\Jetpack\Admin_UI\Admin_Menu::remove_menu( 'jetpack-ai' );
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			StatusCache::clear();
		}
	}
}
