<?php
/**
 * Test class for wpcom-admin-menu.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Class WPCOM_Admin_Menu_Test
 */
class WPCOM_Admin_Menu_Test extends \WorDBless\BaseTestCase {

	public function test_module_management_availability_follows_the_host_route() {
		foreach ( array(
			'personal-bundle' => false,
			'value_bundle'    => false,
			'business-bundle' => true,
		) as $slug => $available ) {
			\Automattic\Jetpack\Current_Plan::update_from_site_record( array( 'plan' => array( 'product_slug' => $slug ) ) );
			$this->assertSame( $available, apply_filters( 'jetpack_my_jetpack_modules_management_available', true ), $slug );
		}
	}

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Domain for the test site.
	 *
	 * @var string
	 */
	private static $domain;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_pass'  => 'pass',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);

		self::$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	}

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		global $menu, $submenu;
		$menu    = array();
		$submenu = array();

		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Tear down each test.
	 *
	 * Undo the platform constants, Host cache and modernization filters the rollout
	 * tests set, so they don't leak into the next case. (`jetpack_options['id']` is
	 * stored in the WorDBless DB, which is reset between tests.)
	 */
	public function tear_down() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		Status_Cache::clear();
		remove_all_filters( 'rsm_jetpack_ui_modernization_newsletter' );
		remove_all_filters( 'rsm_jetpack_ui_modernization_backup' );
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		delete_option( 'wpcom_admin_interface' );
		delete_option( 'wpcom_ai_launchpad_no_guidance' );
		delete_option( 'wpcom_ai_launchpad_enabled' );
		delete_option( 'wpcom_ai_launchpad_dismissed' );

		parent::tear_down();
	}

	/**
	 * The My Home menu URL, or null when the item isn't registered.
	 *
	 * @return string|null
	 */
	private function get_my_home_menu_slug() {
		global $menu;

		foreach ( $menu as $item ) {
			if ( isset( $item[2] ) && str_starts_with( $item[2], 'https://wordpress.com/home/' ) ) {
				return $item[2];
			}
		}

		return null;
	}

	/**
	 * My Home is registered by default.
	 *
	 * Runs in a separate process: elsewhere in the suite, Brain Monkey mocks
	 * `wpcom_ai_launchpad_is_eligible()`, which `wpcom_add_my_home_menu()` also calls for real.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_my_home_menu_is_added_by_default() {
		wpcom_add_my_home_menu();
		$this->assertSame( 'https://wordpress.com/home/' . self::$domain, $this->get_my_home_menu_slug() );
	}

	/**
	 * No-guidance sites get no My Home menu at all.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_my_home_menu_is_hidden_for_no_guidance_sites() {
		update_option( 'wpcom_ai_launchpad_no_guidance', 1 );
		wpcom_add_my_home_menu();
		$this->assertNull( $this->get_my_home_menu_slug() );
	}

	/**
	 * Skipping the AI Launchpad wizard also counts as no-guidance: no My Home menu.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_my_home_menu_is_hidden_after_skipping_the_ai_launchpad() {
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		update_option( 'wpcom_ai_launchpad_dismissed', 1 );
		wpcom_add_my_home_menu();
		$this->assertNull( $this->get_my_home_menu_slug() );
	}

	/**
	 * AI Launchpad sites get no My Home menu, including for users who can't open Site Setup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_my_home_menu_is_hidden_on_ai_launchpad_sites_for_every_user() {
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		wpcom_add_my_home_menu();
		$this->assertNull( $this->get_my_home_menu_slug() );

		wp_set_current_user( $this->create_editor() );
		wpcom_add_my_home_menu();
		$this->assertNull( $this->get_my_home_menu_slug() );
	}

	/**
	 * Legacy launchpad sites keep My Home for non-administrators too.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_my_home_menu_is_added_for_editors_on_legacy_sites() {
		wp_set_current_user( $this->create_editor() );
		wpcom_add_my_home_menu();
		$this->assertSame( 'https://wordpress.com/home/' . self::$domain, $this->get_my_home_menu_slug() );
	}

	/**
	 * Creates an editor, who can't open Site Setup.
	 *
	 * @return int The user ID.
	 */
	private function create_editor() {
		return wp_insert_user(
			array(
				'user_login' => 'editor_user',
				'user_pass'  => 'pass',
				'user_email' => 'editor@example.com',
				'role'       => 'editor',
			)
		);
	}

	/**
	 * The Jetpack submenu slug for the legacy Calypso "Subscribers" link, or null when
	 * it isn't present. `wpcom_add_jetpack_submenu()` registers
	 * `https://wordpress.com/subscribers/<domain>` while the Newsletter modernization
	 * gate is off, and retires it once the gate is on.
	 *
	 * @return string|null
	 */
	private function get_legacy_subscribers_submenu_slug() {
		global $submenu;

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( isset( $item[2] ) && str_starts_with( $item[2], 'https://wordpress.com/subscribers/' ) ) {
				return $item[2];
			}
		}

		return null;
	}

	/**
	 * The Newsletter modernization gate now defaults on for every site, so by default
	 * `wpcom_add_jetpack_submenu()` retires the legacy Calypso "Subscribers" submenu —
	 * the unified Newsletter page owns the Subscribers tab.
	 */
	public function test_jetpack_submenu_retires_legacy_subscribers_link_by_default() {
		\Jetpack_Options::update_option( 'id', 200 );

		wpcom_add_jetpack_submenu();

		$this->assertNull(
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must be retired by default now that the rollout is at 100%.'
		);
	}

	/**
	 * Hosts (and a11ns who want the legacy view back) can still opt out with
	 * `add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' )`,
	 * which keeps the legacy Calypso "Subscribers" submenu instead of retiring it.
	 */
	public function test_jetpack_submenu_keeps_legacy_subscribers_link_when_modernization_filter_off() {
		\Jetpack_Options::update_option( 'id', 200 );
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );

		wpcom_add_jetpack_submenu();

		$this->assertSame(
			'https://wordpress.com/subscribers/' . self::$domain,
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must remain when the modernization gate is filtered off.'
		);
	}

	/**
	 * When the Newsletter modernization gate is forced on, the unified Newsletter page
	 * owns the Subscribers tab and the legacy Calypso "Subscribers" submenu is retired.
	 */
	public function test_jetpack_submenu_retires_legacy_subscribers_link_when_modernization_filter_on() {
		\Jetpack_Options::update_option( 'id', 200 );
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_true' );

		wpcom_add_jetpack_submenu();

		$this->assertNull(
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must be retired when the modernization gate is on.'
		);
	}

	/**
	 * The Jetpack submenu item registered under the given slug, or null when absent.
	 *
	 * @param string $slug Submenu slug.
	 * @return array|null
	 */
	private function get_jetpack_submenu_item( string $slug ) {
		global $submenu;

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( isset( $item[2] ) && $slug === $item[2] ) {
				return $item;
			}
		}

		return null;
	}

	/**
	 * Registers a stand-in for the native Activity Log page that the
	 * `jetpack-activity-log` package adds under Jetpack on `admin_menu`.
	 */
	private function register_native_activity_log_page() {
		add_submenu_page( 'jetpack', 'Activity Log', 'Activity Log', 'manage_options', 'jetpack-activity-log', '__return_null' );
	}

	/**
	 * Admin interface values an Atomic site can use.
	 *
	 * @return array
	 */
	public static function admin_interface_provider() {
		return array(
			'default (Calypso) interface' => array( 'calypso' ),
			'wp-admin interface'          => array( 'wp-admin' ),
		);
	}

	/**
	 * Atomic sites keep the native Activity Log page and do not get the Calypso link,
	 * whichever admin interface they use.
	 *
	 * @param string $admin_interface Value of the `wpcom_admin_interface` option.
	 *
	 * @dataProvider admin_interface_provider
	 */
	#[DataProvider( 'admin_interface_provider' )]
	public function test_jetpack_submenu_keeps_native_activity_log_on_atomic( $admin_interface ) {
		\Jetpack_Options::update_option( 'id', 200 );
		update_option( 'wpcom_admin_interface', $admin_interface );
		$this->register_native_activity_log_page();

		wpcom_add_jetpack_submenu();

		$this->assertNull(
			$this->get_jetpack_submenu_item( 'https://wordpress.com/activity-log/' . self::$domain ),
			'The Calypso Activity Log link must not be added when the native page is registered.'
		);

		$native_item = $this->get_jetpack_submenu_item( 'jetpack-activity-log' );
		$this->assertNotNull( $native_item );
		$this->assertStringNotContainsString(
			'hide-if-js',
			$native_item[4] ?? '',
			'The native Activity Log page must stay visible.'
		);
	}

	/**
	 * When the native Activity Log page is not registered (for example, the user is not
	 * connected), an Atomic site behaves like a self-hosted site: no Calypso link is added.
	 */
	public function test_jetpack_submenu_does_not_link_to_calypso_activity_log_when_native_page_is_missing() {
		\Jetpack_Options::update_option( 'id', 200 );

		wpcom_add_jetpack_submenu();
		$this->assertNull(
			$this->get_jetpack_submenu_item( 'https://wordpress.com/activity-log/' . self::$domain ),
			'The Calypso Activity Log link must not be added on Atomic sites.'
		);
	}

	/**
	 * Simple sites keep the Calypso Activity Log link and hide the native page.
	 *
	 * Runs in a separate process because `wpcom_add_jetpack_submenu()` detects Simple
	 * sites through the real `IS_WPCOM` constant.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_submenu_links_activity_log_to_calypso_on_simple_sites() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		// The class fixtures may not exist in the isolated process, so set up an admin
		// here: `add_submenu_page()` drops items the current user cannot access.
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'simple_admin_user',
				'user_pass'  => 'pass',
				'user_email' => 'simple_admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );

		$this->register_native_activity_log_page();

		wpcom_add_jetpack_submenu();

		$this->assertNotNull(
			$this->get_jetpack_submenu_item( 'https://wordpress.com/activity-log/' . $domain ),
			'Simple sites must keep the Calypso Activity Log link.'
		);

		$native_item = $this->get_jetpack_submenu_item( 'jetpack-activity-log' );
		$this->assertNotNull( $native_item );
		$this->assertStringContainsString(
			'hide-if-js',
			$native_item[4] ?? '',
			'Simple sites must hide the native Activity Log page.'
		);
	}

	/**
	 * Sets up a Simple site with an admin and the native Activity Log flag on.
	 *
	 * Callers run in a separate process, because `wpcom_add_jetpack_submenu()` reads the real `IS_WPCOM` constant.
	 *
	 * @param bool $package_supports_simple Whether the bundled package can register the page on Simple.
	 * @return string The site's domain.
	 */
	private function set_up_simple_site_with_native_activity_log( $package_supports_simple ) {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'simple_admin_user',
					'user_pass'  => 'pass',
					'user_email' => 'simple_admin@example.com',
					'role'       => 'administrator',
				)
			)
		);

		require_once __DIR__ . '/fixtures/class-jetpack-activity-log.php';
		// @phan-suppress-next-line PhanUndeclaredClassStaticProperty -- Declared in a fixture excluded from Phan, as the real package is.
		\Automattic\Jetpack\Activity_Log\Jetpack_Activity_Log::$supports_simple = $package_supports_simple;
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_NATIVE_ACTIVITY_LOG_FLAG, '__return_true' );

		return wp_parse_url( home_url(), PHP_URL_HOST );
	}

	/**
	 * With the flag on, Simple sites show the native page instead of the Calypso link.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_submenu_shows_native_activity_log_on_simple_sites_when_flagged() {
		$domain = $this->set_up_simple_site_with_native_activity_log( true );

		wpcom_add_jetpack_submenu();

		$this->assertNull( $this->get_jetpack_submenu_item( 'https://wordpress.com/activity-log/' . $domain ) );
		$native_item = $this->get_jetpack_submenu_item( 'jetpack-activity-log' );
		$this->assertNotNull( $native_item );
		$this->assertStringNotContainsString( 'hide-if-js', $native_item[4] ?? '' );
	}

	/**
	 * Jetpack deploys separately, so the flag can be on while the bundled package predates Simple support.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_submenu_falls_back_to_calypso_activity_log_when_the_package_cannot_register() {
		$domain = $this->set_up_simple_site_with_native_activity_log( false );

		wpcom_add_jetpack_submenu();

		$this->assertNotNull( $this->get_jetpack_submenu_item( 'https://wordpress.com/activity-log/' . $domain ) );
	}

	/**
	 * Exactly one Backup entry shows: wp-admin's once the flag is on and the page exists, else Calypso's.
	 *
	 * @dataProvider provide_backup_entry_cases
	 *
	 * @param string $setup           'default', 'filter off', or 'legacy sticker'.
	 * @param bool   $page_registered Whether something registered the `jetpack-backup` page.
	 * @param string $expected        The visible entry: 'calypso' or 'wp-admin'.
	 */
	#[DataProvider( 'provide_backup_entry_cases' )]
	public function test_jetpack_submenu_shows_one_backup_entry( $setup, $page_registered, $expected ) {
		global $submenu;

		\Jetpack_Options::update_option( 'id', 200 );
		if ( 'filter off' === $setup ) {
			add_filter( 'rsm_jetpack_ui_modernization_backup', '__return_false' );
		}
		if ( 'legacy sticker' === $setup ) {
			$GLOBALS['wpcom_site_stickers_test_value'] = array( 'use-backup-legacy-dashboard' );
		}
		if ( $page_registered ) {
			$submenu['jetpack'][] = array( 'Backup', 'manage_options', 'jetpack-backup', 'Jetpack VaultPress Backup' );
		}

		wpcom_add_jetpack_submenu();

		$entries = array(
			'calypso'  => 'https://wordpress.com/backup/' . self::$domain,
			'wp-admin' => 'jetpack-backup',
		);
		$visible = array();
		foreach ( $submenu['jetpack'] as $item ) {
			if ( in_array( $item[2], $entries, true ) && ! str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
				$visible[] = $item[2];
			}
		}

		$this->assertSame( array( $entries[ $expected ] ), $visible );
	}

	/**
	 * What switches the flag, page registration and the entry that should show.
	 *
	 * @return array[]
	 */
	public static function provide_backup_entry_cases() {
		return array(
			'default, page registered'         => array( 'default', true, 'wp-admin' ),
			'filter off, page registered'      => array( 'filter off', true, 'calypso' ),
			'legacy sticker, page registered'  => array( 'legacy sticker', true, 'calypso' ),
			'default, nothing serves the slug' => array( 'default', false, 'calypso' ),
		);
	}

	/**
	 * Jetpack > Protect is hidden with a class, which Calypso's sidebar honors, unless the standalone plugin is active.
	 *
	 * Runs in a separate process because the standalone row declares `Jetpack_Protect`.
	 *
	 * @dataProvider provide_protect_entry_cases
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $standalone Whether the standalone Protect plugin is active.
	 * @param bool $hidden     Whether the entry should be hidden.
	 */
	#[DataProvider( 'provide_protect_entry_cases' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_submenu_hides_protect_entry( $standalone, $hidden ) {
		global $submenu;

		\Jetpack_Options::update_option( 'id', 200 );
		if ( $standalone ) {
			class_alias( get_class( new class() {} ), 'Jetpack_Protect' );
		}
		$submenu['jetpack'][] = array( 'Protect', 'manage_options', 'jetpack-protect', 'Jetpack Protect' );

		wpcom_add_jetpack_submenu();

		$item = current( wp_list_filter( $submenu['jetpack'], array( 2 => 'jetpack-protect' ) ) );
		$this->assertSame( $hidden, str_contains( $item[4] ?? '', 'hide-if-js' ) );
	}

	/**
	 * Whether the standalone plugin is active, and whether the entry should be hidden.
	 *
	 * @return array[]
	 */
	public static function provide_protect_entry_cases() {
		return array(
			'Jetpack plugin only'       => array( false, true ),
			'standalone plugin present' => array( true, false ),
		);
	}

	/**
	 * Tests wpcom_add_hosting_menu
	 */
	public function test_add_hosting_menu() {
		global $menu;

		wpcom_add_hosting_menu();

		// Find the Hosting menu item.
		$hosting_menu = null;
		foreach ( $menu as $item ) {
			if ( strpos( $item[2], 'https://wordpress.com/overview/' ) !== false ) {
				$hosting_menu = $item;
				break;
			}
		}

		$this->assertNotNull( $hosting_menu, 'Hosting menu item should exist.' );
		$this->assertSame( 'https://wordpress.com/overview/' . self::$domain, $hosting_menu[2] );
		$this->assertStringContainsString( 'inline-icon', $hosting_menu[0] );
		$this->assertStringContainsString( 'dashicons-external', $hosting_menu[0] );
	}

	/**
	 * Tests wpcom_add_upgrades_menu
	 */
	public function test_add_upgrades_menu() {
		global $submenu;

		wpcom_add_upgrades_menu();

		$this->assertSame( 'https://wordpress.com/plans/' . self::$domain, $submenu['paid-upgrades.php'][1][2] );
		$this->assertSame( 'https://wordpress.com/add-ons/' . self::$domain, $submenu['paid-upgrades.php'][2][2] );
		$this->assertSame( 'https://wordpress.com/domains/manage/' . self::$domain, $submenu['paid-upgrades.php'][3][2] );
		$this->assertSame( 'https://wordpress.com/email/' . self::$domain, $submenu['paid-upgrades.php'][4][2] );
		$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . self::$domain, $submenu['paid-upgrades.php'][5][2] );
	}

	/**
	 * Tests wpcom_add_upgrades_menu is not added on staging sites.
	 */
	public function test_add_upgrades_menu_not_on_staging() {
		global $menu;

		update_option( 'wpcom_is_staging_site', true );
		wpcom_add_upgrades_menu();

		$upgrades_menu = null;
		foreach ( $menu as $item ) {
			if ( $item[2] === 'paid-upgrades.php' ) {
				$upgrades_menu = $item;
				break;
			}
		}

		$this->assertNull( $upgrades_menu, 'Upgrades menu should not exist on staging sites.' );

		delete_option( 'wpcom_is_staging_site' );
	}

	/**
	 * Runs the retired Tools > Marketing redirect and reports where it tried to send
	 * the request.
	 *
	 * The function calls `exit` once it has redirected, which would take the test
	 * runner with it, so this throws from the `wp_redirect` filter to unwind before
	 * that line is reached.
	 *
	 * @param string|null $page The `page` query arg to set, or null to omit it.
	 * @return string|null The redirect target, or null when the request was left alone.
	 */
	private function capture_retired_marketing_page_redirect( $page ) {
		unset( $_GET['page'] );
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}

		/**
		 * Unwinds out of `wp_safe_redirect()` carrying the target, so the `exit` that
		 * follows it is never reached.
		 *
		 * @param string $location The redirect target.
		 * @return never
		 * @throws RuntimeException Always, carrying the redirect target.
		 */
		$capture = static function ( $location ) {
			throw new RuntimeException( $location );
		};
		add_filter( 'wp_redirect', $capture );

		try {
			wpcom_redirect_retired_marketing_page();
			return null;
		} catch ( RuntimeException $e ) {
			return $e->getMessage();
		} finally {
			remove_filter( 'wp_redirect', $capture );
			unset( $_GET['page'] );
		}
	}

	/**
	 * The page is gone, so the URL the Calypso sidebar used to point at has to land
	 * somewhere sensible instead of core's "Cannot load wpcom-marketing-tools." screen.
	 */
	public function test_retired_marketing_page_redirects_to_the_dashboard() {
		$this->assertSame(
			admin_url(),
			$this->capture_retired_marketing_page_redirect( 'wpcom-marketing-tools' ),
			'The retired Tools > Marketing URL must land on the dashboard.'
		);
	}

	/**
	 * The redirect keys off one slug, so every other admin page has to pass through
	 * untouched.
	 */
	public function test_retired_marketing_page_redirect_leaves_other_pages_alone() {
		$this->assertNull(
			$this->capture_retired_marketing_page_redirect( 'activitypub' ),
			'An unrelated page slug must not be redirected.'
		);
	}

	/**
	 * Most admin requests carry no `page` at all, and this runs on every one of them.
	 */
	public function test_retired_marketing_page_redirect_leaves_requests_without_a_page_alone() {
		$this->assertNull(
			$this->capture_retired_marketing_page_redirect( null ),
			'A request with no page query arg must not be redirected.'
		);
	}

	/**
	 * WordPress slashes `$_GET` on the way in, so the comparison unslashes before
	 * matching. Guards against someone dropping the `wp_unslash()` call as redundant.
	 */
	public function test_retired_marketing_page_redirect_unslashes_the_page_arg() {
		$this->assertSame(
			admin_url(),
			$this->capture_retired_marketing_page_redirect( 'wpcom-marketing-tools\\' ),
			'The slug must still match once the added slashes are stripped.'
		);
	}

	/**
	 * Sort the Jetpack submenu A to Z between its pinned top and bottom items, on every platform.
	 *
	 * @dataProvider provide_jetpack_menu_environments
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool        $simple   Whether this is a Simple site.
	 * @param string|null $address  Which Settings address the Jetpack plugin registers.
	 * @param array       $expected Expected submenu titles, top to bottom; a hidden item ends in "(hidden)".
	 * @param bool        $atomic   Whether to define the Atomic hosting constants.
	 */
	#[DataProvider( 'provide_jetpack_menu_environments' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_jetpack_submenu_sorts_alphabetically( $simple, $address, $expected, $atomic = true ) {
		global $submenu;
		if ( $simple ) {
			define( 'IS_WPCOM', true );
		} elseif ( $atomic ) {
			define( 'ATOMIC_SITE_ID', 1 );
			define( 'ATOMIC_CLIENT_ID', 2 );
			define( 'WPCOMSH__PLUGIN_FILE', __FILE__ );
		}
		Status_Cache::clear();
		\Jetpack_Options::update_option( 'id', 200 );
		$settings_slug = 'legacy' === $address ? admin_url( 'admin.php?page=jetpack#/settings' ) : 'jetpack-settings';
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'Abonnés', 'manage_options', 'jetpack-abonnes' ),
			array( 'Social', 'manage_options', 'jetpack-social' ),
			array( 'Beta Tester', 'manage_options', 'jetpack-beta' ),
			array( 'SEO', 'manage_options', 'jetpack-seo' ),
			array( 'Akismet Anti-spam <span class="awaiting-mod">2</span>', 'manage_options', 'akismet-key-config' ),
			array( 'Akismet Anti-spam <span class="awaiting-mod">2</span>', 'manage_options', 'akismet-key-config' ),
			array( 'Activity Log', 'manage_options', 'jetpack-activity-log' ),
		);
		if ( ! $simple ) {
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu['jetpack'][] = array( 'Settings', 'manage_options', $settings_slug );
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu['jetpack'][] = array( 'My Jetpack', 'manage_options', 'my-jetpack' );
		}

		wpcom_add_jetpack_submenu();

		$titles = array_map(
			function ( $item ) {
				$title = wp_strip_all_tags( $item[0] );
				return str_contains( $item[4] ?? '', 'hide-if-js' ) ? "$title (hidden)" : $title;
			},
			$submenu['jetpack']
		);
		$this->assertSame( $expected, $titles );
	}

	/**
	 * Atomic Personal and Premium hide My Jetpack and redirect it to Stats, so it keeps the
	 * top link even though it is hidden, ahead of a visible Modules page; the upgrade link
	 * sorts after Settings.
	 */
	public function test_jetpack_submenu_keeps_a_hidden_my_jetpack_first() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'Upgrade Jetpack', 'manage_options', 'https://jetpack.com/redirect/?source=jetpack-wpadmin-sidebar-free-plan-upsell-menu-item&site=example.org' ),
			array( 'Settings', 'manage_options', 'jetpack-settings', '', 'hide-if-js' ),
			array( 'Scan', 'manage_options', 'https://wordpress.com/scan/example.org' ),
			array( 'Akismet Anti-spam', 'manage_options', 'akismet-key-config' ),
			array( 'Modules', 'manage_options', 'jetpack_modules' ),
			array( 'My Jetpack', 'manage_options', 'my-jetpack', '', 'hide-if-js' ),
		);

		wpcom_sort_jetpack_submenu();

		$this->assertSame(
			array( 'My Jetpack', 'Modules', 'Akismet Anti-spam', 'Scan', 'Settings', 'Upgrade Jetpack' ),
			array_column( $submenu['jetpack'], 0 )
		);
	}

	/**
	 * Tools and Settings still use the fixed-list reorder: listed slugs first, in list order and
	 * each item once even when two slugs match it, then the rest as they were. A menu that isn't
	 * registered is left alone.
	 */
	public function test_reorder_submenu_puts_listed_slugs_first() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['tools.php'] = array(
			array( 'Theme File Editor', 'manage_options', 'theme-editor.php' ),
			array( 'Export', 'manage_options', 'export.php' ),
			array( 'Import', 'manage_options', 'https://wordpress.com/import/' . self::$domain ),
			array( 'Export Media Library', 'manage_options', 'export-media-files' ),
		);

		wpcom_reorder_submenu( 'tools.php', array( 'import', 'export', 'export-media-files' ) );
		wpcom_reorder_submenu( 'missing.php', array( 'import' ) );

		$this->assertSame(
			array( 'Import', 'Export', 'Export Media Library', 'Theme File Editor' ),
			array_column( $submenu['tools.php'], 0 )
		);
		$this->assertArrayNotHasKey( 'missing.php', $submenu );
	}

	/**
	 * Platforms and Settings addresses across Jetpack releases.
	 *
	 * @return array
	 */
	public static function provide_jetpack_menu_environments() {
		$atomic = array( 'My Jetpack', 'Abonnés', 'Activity Log', 'Akismet Anti-spam 2', 'Backup', 'Monetize', 'Scan', 'SEO', 'Social', 'Beta Tester', 'Settings' );
		$simple = array( 'Activity Log', 'Activity Log (hidden)', 'Abonnés', 'Akismet Anti-spam 2', 'Backup', 'Monetize', 'Podcast', 'Scan', 'SEO', 'Social', 'Traffic', 'Beta Tester' );

		return array(
			'Atomic legacy Settings'             => array( false, 'legacy', $atomic ),
			'Atomic Settings'                    => array( false, 'own', $atomic ),
			'Simple'                             => array( true, null, $simple ),
			'Other host with WordPress.com menu' => array( false, 'own', $atomic, false ),
		);
	}
}
