<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Activity_Log\Jetpack_Activity_Log;
use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\My_Jetpack\Jetpack_Manage;
use Automattic\Jetpack\Scan\Admin_Sidebar_Link;
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

		/*
		 * Admin_Menu::$initialized is static and its admin_menu hook is stripped when WP_UnitTestCase
		 * restores hooks at teardown. Without this reset, any earlier test that calls add_menu() leaves
		 * the class initialized but unhooked, so the menu never registers and this test silently skips.
		 */
		$this->reset_admin_menu();
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
	 * Clears Admin_Menu's static state and the menu globals between renders.
	 */
	private function reset_admin_menu() {
		// add_submenu_page() writes to all four of these and WP_UnitTestCase restores none of them.
		global $menu, $submenu, $_parent_pages, $_registered_pages;
		$menu              = array();
		$submenu           = array();
		$_parent_pages     = array();
		$_registered_pages = array();

		$reflection = new \ReflectionClass( Admin_Menu::class );

		foreach ( array( 'menu_items', 'page_hooks' ) as $name ) {
			if ( $reflection->hasProperty( $name ) ) {
				$property = $reflection->getProperty( $name );
				// @todo Remove this call once we no longer need to support PHP <8.1.
				if ( PHP_VERSION_ID < 80100 ) {
					$property->setAccessible( true );
				}
				$property->setValue( null, array() );
			}
		}

		if ( $reflection->hasProperty( 'initialized' ) ) {
			$initialized = $reflection->getProperty( 'initialized' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$initialized->setAccessible( true );
			}
			$initialized->setValue( null, false );
		}
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

		// Jetpack only inits My Jetpack for admin/cron/POST/CLI requests, none of which
		// hold under PHPUnit, so register it by hand or it is absent from the menu.
		My_Jetpack_Initializer::add_my_jetpack_menu_item();

		$jetpack_stats = new Dashboard();
		$jetpack_stats::init();

		$jetpack_video = new Admin_UI();
		$jetpack_video->init();

		$jetpack_backup = new Jetpack_Backup();
		$jetpack_backup->initialize();

		// Scan, VaultPress Backup, Jetpack Manage and Subscribers only register under a condition,
		// and they are the call sites the two curation PRs before #52003 renumbered.
		$this->satisfy_conditional_registrar_gates();
		Admin_Sidebar_Link::instance()->maybe_add_admin_link();
		Jetpack_Manage::add_submenu_jetpack();
		Jetpack_Subscriptions::init()->add_subscribers_menu();

		/*
		 * Nothing in this fixture registers an external link or a bottom-tier item on its own,
		 * so the assertions covering those tiers would pass vacuously. Register one of each,
		 * titled to sort first alphabetically so a broken tier shows up as a misplacement.
		 */
		Admin_Menu::add_menu( 'Aaa External', 'Aaa External <span aria-hidden="true">↗</span>', 'manage_options', 'https://example.org/aaa-external', null, 100 );
		Admin_Menu::add_menu( 'Aaa Bottom', 'Aaa Bottom', 'manage_options', 'aaa-bottom-fixture', '__return_null', 998 );

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
				|| 'aaa-bottom-fixture' === $item[2]
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
		$this->assertNotEmpty( $external, 'Expected an external link in the menu, otherwise the internal-before-external check proves nothing.' );

		$bottom_at = array_search( 'aaa-bottom-fixture', array_column( $items, 2 ), true );
		$this->assertNotFalse( $bottom_at, 'The bottom-tier fixture should be registered.' );
		$this->assertGreaterThan( $last_unpinned_at, $bottom_at, 'Bottom-tier items should sort below every feature page and external link.' );

		$this->assertGreaterThan( $last_unpinned_at, $settings_at, 'Settings should be pinned below every feature page and external link.' );

		$alphabetical = $internal;
		usort( $alphabetical, 'strnatcasecmp' );

		$this->assertSame( $alphabetical, $internal, 'Jetpack submenu items should be ordered alphabetically by menu title.' );

		/*
		 * An off-tier position on an external link leaves it after the internal pages, so the
		 * check above misses it. Renumbering them is what PRs #47417 and #50104 actually did.
		 */
		$this->assertGreaterThan( 1, count( $external ), 'Expected several external links, otherwise their ordering proves nothing.' );

		$alphabetical_external = $external;
		usort( $alphabetical_external, 'strnatcasecmp' );

		$this->assertSame( $alphabetical_external, $external, 'External links should be ordered alphabetically among themselves.' );
	}

	/**
	 * The menu callbacks real products register through, keyed by product.
	 *
	 * These are the admin_menu callbacks themselves rather than each product's init(), which guards
	 * on static state and so registers nothing the second time a test calls it.
	 *
	 * @return array Product name to callable.
	 */
	private function menu_registrars() {
		$this->satisfy_conditional_registrar_gates();

		return array(
			'my-jetpack'     => array( My_Jetpack_Initializer::class, 'add_my_jetpack_menu_item' ),
			'activity-log'   => array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ),
			'backup'         => array( Jetpack_Backup::class, 'add_wp_admin_submenu' ),
			'videopress'     => array( Admin_UI::class, 'enable_menu' ),
			'scan-backup'    => array( Admin_Sidebar_Link::instance(), 'maybe_add_admin_link' ),
			'jetpack-manage' => array( Jetpack_Manage::class, 'add_submenu_jetpack' ),
			'subscribers'    => array( Jetpack_Subscriptions::init(), 'add_subscribers_menu' ),
			'settings'       => array( new Jetpack_React_Page(), 'jetpack_add_settings_sub_nav_item' ),
		);
	}

	/**
	 * Opens the gates on the four registrars that only register under a condition.
	 *
	 * Scan, Backup, Jetpack Manage and Subscribers are the call sites that regressed in the two
	 * curation PRs before #52003, so leaving them unregistered here would test past the history.
	 */
	private function satisfy_conditional_registrar_gates() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';
		require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
		// Only loaded when the Scan module is active, so the autoloader does not reach it here.
		require_once JETPACK__PLUGIN_DIR . 'modules/scan/class-admin-sidebar-link.php';

		$scan          = new stdClass();
		$scan->state   = 'idle';
		$rewind        = new stdClass();
		$rewind->state = 'active';
		set_transient( 'jetpack_scan_state', $scan, WEEK_IN_SECONDS );
		set_transient( 'jetpack_rewind_state', $rewind, WEEK_IN_SECONDS );

		set_transient(
			'jetpack_connected_user_data_' . get_current_user_id(),
			array( 'site_count' => 2 ),
			WEEK_IN_SECONDS
		);

		// The Subscribers link registers only where its modern wp-admin replacements are off.
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );
		add_filter( 'jetpack_wp_admin_subscriber_management_enabled', '__return_false' );
	}

	/**
	 * Runs a set of real product registrars through a request and reports the resulting slugs.
	 *
	 * @param array $registrars Callables from menu_registrars().
	 * @return array Menu slugs, in the order WordPress rendered them.
	 */
	private function render_menu( array $registrars ) {
		$this->reset_admin_menu();

		/*
		 * Loading the plugin leaves its own admin_menu callbacks hooked, so without this the products
		 * under test register twice and products outside the set register anyway. Admin_Menu re-hooks
		 * its own sorter from add_menu(), since the reset above uninitialized it.
		 */
		remove_all_actions( 'admin_menu' );

		foreach ( $registrars as $registrar ) {
			call_user_func( $registrar );
		}

		do_action( 'admin_menu' );

		global $submenu;
		$slugs = empty( $submenu['jetpack'] ) ? array() : array_column( $submenu['jetpack'], 2 );

		// The free-plan upsell is appended after the sort, so it is not part of the ordering contract.
		return array_values(
			array_filter(
				$slugs,
				static function ( $slug ) {
					return false === strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
				}
			)
		);
	}

	/**
	 * The same active products give the same order whichever one registered first.
	 *
	 * A product taking an explicit position stays deterministic, so it is test_jetpack_admin_menu_order()
	 * above, not this one, that catches that.
	 */
	public function test_menu_order_is_independent_of_registrar_order() {
		$registrars = $this->menu_registrars();
		$order      = $this->render_menu( $registrars );

		$this->assertNotEmpty( $order, 'Expected the real registrars to produce a Jetpack submenu.' );
		$this->assertSame( 'my-jetpack', $order[0], 'My Jetpack should be pinned first.' );
		$this->assertSame( $order, $this->render_menu( array_reverse( $registrars ) ) );

		// Derived rather than a named subset, which would silently go stale as registrars are added.
		$even = array();
		$odd  = array();
		foreach ( array_values( $registrars ) as $index => $registrar ) {
			if ( 0 === $index % 2 ) {
				$even[] = $registrar;
			} else {
				$odd[] = $registrar;
			}
		}

		$this->assertSame( $order, $this->render_menu( array_merge( $odd, $even ) ) );
	}

	/**
	 * A site with nothing but My Jetpack still gets a sidebar, with My Jetpack in it.
	 */
	public function test_only_my_jetpack() {
		$registrars = $this->menu_registrars();

		$this->assertSame( array( 'my-jetpack' ), $this->render_menu( array( $registrars['my-jetpack'] ) ) );
	}
}
