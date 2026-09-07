<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Stats_Admin\Dashboard;
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
	}

	/**
	 * Test the order of the Jetpack admin menu items.
	 *
	 * Encodes the position scheme: My Jetpack is pinned first, external links (marked with ↗)
	 * sort after every internal page, Settings is pinned below both, and everything else is
	 * alphabetical by menu title.
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
			$this->markTestSkipped( 'No Jetpack submenu was registered.' );
		}

		$items = array_values( $submenu['jetpack'] );

		$this->assertSame( 'my-jetpack', $items[0][2], 'My Jetpack should be pinned to the top of the Jetpack submenu.' );

		$settings_slug = Jetpack::admin_url( array( 'page' => 'jetpack#/settings' ) );
		$settings_at   = array_search( $settings_slug, array_column( $items, 2 ), true );

		$this->assertNotFalse( $settings_at, 'Settings should be registered in the Jetpack submenu.' );

		/*
		 * Four kinds of entry sit outside the alphabetical run: My Jetpack is pinned to the top,
		 * Beta Tester and Settings are pinned to the bottom, and the free-plan upsell is appended
		 * by Admin_Menu after the sorted items have been registered.
		 */
		$pinned = static function ( $item ) use ( $settings_slug ) {
			return 'my-jetpack' === $item[2]
				|| 'jetpack-beta' === $item[2]
				|| $settings_slug === $item[2]
				|| false !== strpos( $item[2], Admin_Menu::UPGRADE_MENU_SLUG );
		};

		$internal         = array();
		$external         = array();
		$last_unpinned_at = -1;

		foreach ( $items as $index => $item ) {
			if ( $pinned( $item ) ) {
				continue;
			}

			$last_unpinned_at = $index;

			if ( false !== strpos( $item[0], '↗' ) ) {
				$external[] = $item[0];
				continue;
			}

			$this->assertEmpty( $external, "{$item[0]} is an internal page and should sort before every external link." );
			$internal[] = $item[0];
		}

		$this->assertNotEmpty( $internal, 'Expected at least one internal Jetpack submenu item to check the ordering of.' );

		$this->assertGreaterThan( $last_unpinned_at, $settings_at, 'Settings should be pinned below every feature page and external link.' );

		$alphabetical = $internal;
		usort( $alphabetical, 'strcmp' );

		$this->assertSame( $alphabetical, $internal, 'Jetpack submenu items should be ordered alphabetically by menu title.' );
	}
}
