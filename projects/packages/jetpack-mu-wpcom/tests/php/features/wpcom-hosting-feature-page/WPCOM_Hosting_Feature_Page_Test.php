<?php
/**
 * Tests for the hosting feature pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Backup;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Feature_Upgrades;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Hosting_Feature_Page;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Scan;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-scan/wpcom-scan.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Tests for the hosting feature pages. Shared behavior is exercised through the Backup page.
 *
 * Each test runs in its own process: stubbing wpcom_site_has_feature() defines it for the rest of the run.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class WPCOM_Hosting_Feature_Page_Test extends \WorDBless\BaseTestCase {

	/**
	 * Screen ID wp-admin gives this page, from its parent and menu slug.
	 */
	const SCREEN_ID = 'jetpack_page_jetpack-backup';

	/**
	 * A site whose plan lacks the feature must not be offered activation.
	 */
	public function test_state_is_upgrade_without_the_plan() {
		$this->assertSame(
			WPCOM_Backup::STATE_UPGRADE,
			WPCOM_Backup::get_state( 1 )
		);
	}

	/**
	 * Stand in for wpcom's plan lookup, with a plan that includes nothing, and its
	 * transfer checks, on a Simple site that has never transferred.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		// Some earlier suites never tear Brain Monkey down, and a leftover stub would block this one.
		\Brain\Monkey\tearDown();
		\Brain\Monkey\setUp();
		$this->grant_feature();
		Functions\when( 'woa_get_latest_transfer' )->justReturn( new \WP_Error( 'not_found' ) );
		Functions\when( 'A8C\Atomic\has_site_pending_automated_transfer' )->justReturn( false );
		Functions\when( 'A8C\Atomic\is_wpcom_atomic' )->justReturn( false );
		Functions\when( 'A8C\Atomic\Eligibility\get_status_for_site' )->justReturn( null );
	}

	/**
	 * Give the site exactly these plan features.
	 *
	 * @param string ...$granted The features the plan includes.
	 * @return void
	 */
	private function grant_feature( ...$granted ) {
		Functions\when( 'wpcom_site_has_feature' )->alias(
			static function ( $feature ) use ( $granted ) {
				return in_array( $feature, $granted, true );
			}
		);
	}

	/**
	 * Each page, a feature granted on its own, and whether that unlocks the page's feature.
	 *
	 * @return array
	 */
	public static function provide_granted_features() {
		return array(
			'Backup with self-serve backups' => array( WPCOM_Backup::class, \WPCOM_Features::BACKUPS_SELF_SERVE, true ),
			'Backup with self-serve Scan'    => array( WPCOM_Backup::class, \WPCOM_Features::SCAN_SELF_SERVE, false ),
			'Protect with self-serve Scan'   => array( WPCOM_Scan::class, \WPCOM_Features::SCAN_SELF_SERVE, true ),
			// Personal and Premium plans include SCAN but never show Scan's UI.
			'Protect with SCAN alone'        => array( WPCOM_Scan::class, \WPCOM_Features::SCAN, false ),
		);
	}

	/**
	 * Each page asks the plan for its own feature, and only that one.
	 *
	 * @param string $page     Page class.
	 * @param string $granted  The feature the plan includes.
	 * @param bool   $expected Whether the page should see its feature.
	 *
	 * @dataProvider provide_granted_features
	 */
	#[DataProvider( 'provide_granted_features' )]
	public function test_page_checks_its_own_plan_feature( $page, $granted, $expected ) {
		$this->grant_feature( $granted );

		$this->assertSame( $expected, $page::has_feature() );
	}

	/**
	 * A Simple site with the plan is offered the transfer that switches the feature on.
	 *
	 * @param string $page    Page class.
	 * @param string $feature The page's plan feature.
	 *
	 * @dataProvider provide_page_features
	 */
	#[DataProvider( 'provide_page_features' )]
	public function test_simple_site_with_the_plan_is_offered_activation( $page, $feature ) {
		$this->grant_feature( \WPCOM_Features::ATOMIC, $feature );

		$this->assertSame( WPCOM_Hosting_Feature_Page::STATE_ACTIVATE, $page::get_state( 1 ) );
	}

	/**
	 * Activation needs the plan's hosting platform as well as the feature, as in Calypso.
	 *
	 * @param string[] $features Features the site's plan includes.
	 * @param string   $expected Expected state.
	 *
	 * @dataProvider provide_features_and_states
	 */
	#[DataProvider( 'provide_features_and_states' )]
	public function test_state_follows_the_plan_features( array $features, $expected ) {
		$this->grant_feature( ...$features );

		$this->assertSame( $expected, WPCOM_Backup::get_state( 1 ) );
	}

	/**
	 * Feature sets and the state each one resolves to.
	 *
	 * @return array[]
	 */
	public static function provide_features_and_states() {
		return array(
			'atomic only'        => array( array( 'atomic' ), WPCOM_Backup::STATE_UPGRADE ),
			'backups only'       => array( array( 'backups-self-serve' ), WPCOM_Backup::STATE_UPGRADE ),
			'atomic and backups' => array( array( 'atomic', 'backups-self-serve' ), WPCOM_Backup::STATE_ACTIVATE ),
		);
	}

	/**
	 * The last-backup download and the failed-transfer notice each belong to one prompt.
	 *
	 * @param string[]    $features        Features the site's plan includes.
	 * @param string|null $status          Latest transfer status, or null for no transfer.
	 * @param bool        $has_reverted    Expected `hasRevertedTransfer`.
	 * @param bool        $transfer_failed Expected `transferFailed`.
	 *
	 * @dataProvider provide_transfer_statuses
	 */
	#[DataProvider( 'provide_transfer_statuses' )]
	public function test_transfer_flags_follow_the_latest_transfer( array $features, $status, $has_reverted, $transfer_failed ) {
		$this->grant_feature( ...$features );
		Functions\when( 'woa_get_latest_transfer' )->justReturn(
			null === $status ? new \WP_Error( 'not_found' ) : (object) array( 'status' => $status )
		);

		$state = WPCOM_Backup::get_initial_state();

		$this->assertSame(
			array( $has_reverted, $transfer_failed ),
			array( $state['hasRevertedTransfer'], $state['transferFailed'] )
		);
	}

	/**
	 * Plan features, latest transfer status, and the flags they produce.
	 *
	 * @return array[]
	 */
	public static function provide_transfer_statuses() {
		$plan = array( 'atomic', 'backups-self-serve' );

		return array(
			'no transfer'                 => array( array(), null, false, false ),
			'reverted, upgrade prompt'    => array( array(), 'reverted', true, false ),
			'reverted, activation prompt' => array( $plan, 'reverted', false, false ),
			'lossless revert still going' => array( array(), 'reverting', false, false ),
			'error, activation prompt'    => array( $plan, 'error', false, true ),
			'error, upgrade prompt'       => array( array(), 'error', false, false ),
		);
	}

	/**
	 * Starting a second transfer on top of a running one is what this state prevents.
	 *
	 * @param string $check The wpcom check that reports the transfer.
	 *
	 * @dataProvider provide_transfer_checks
	 */
	#[DataProvider( 'provide_transfer_checks' )]
	public function test_simple_site_with_a_transfer_underway_is_told_to_wait( $check ) {
		$this->grant_feature( \WPCOM_Features::ATOMIC, \WPCOM_Features::BACKUPS_SELF_SERVE );
		Functions\when( $check )->justReturn( true );

		$this->assertSame( WPCOM_Hosting_Feature_Page::STATE_IN_PROGRESS, WPCOM_Backup::get_state( 1 ) );
	}

	/**
	 * Each wpcom check that reports a transfer already underway.
	 *
	 * @return array
	 */
	public static function provide_transfer_checks() {
		return array(
			'Queued'                         => array( 'A8C\Atomic\has_site_pending_automated_transfer' ),
			'Pending, active or provisioned' => array( 'A8C\Atomic\is_wpcom_atomic' ),
		);
	}

	/**
	 * On WoA the plan makes the feature live, so the page steps aside for the real one.
	 *
	 * @param string $page    Page class.
	 * @param string $feature The page's plan feature.
	 *
	 * @dataProvider provide_page_features
	 */
	#[DataProvider( 'provide_page_features' )]
	public function test_woa_site_with_the_plan_does_not_register_the_page( $page, $feature ) {
		Constants::set_constant( 'IS_ATOMIC', true );
		$this->grant_feature( $feature );

		$this->assertFalse( $page::should_register() );
	}

	/**
	 * Each page with the plan feature that unlocks it.
	 *
	 * @return array
	 */
	public static function provide_page_features() {
		return array(
			'Backup'  => array( WPCOM_Backup::class, \WPCOM_Features::BACKUPS_SELF_SERVE ),
			'Protect' => array( WPCOM_Scan::class, \WPCOM_Features::SCAN_SELF_SERVE ),
		);
	}

	/**
	 * Every page.
	 *
	 * @return array
	 */
	public static function provide_pages() {
		return array(
			'Backup'  => array( WPCOM_Backup::class ),
			'Protect' => array( WPCOM_Scan::class ),
		);
	}

	/**
	 * Every page, with the slug it must keep.
	 *
	 * @return array
	 */
	public static function provide_pinned_slugs() {
		return array(
			'Backup'  => array( WPCOM_Backup::class, 'jetpack-backup' ),
			'Protect' => array( WPCOM_Scan::class, 'jetpack-protect' ),
		);
	}

	/**
	 * A Simple site is never Atomic, so the page always has something to offer —
	 * either the upgrade or the transfer that makes the plan's feature real.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_page_registers_on_simple( $page ) {
		$this->assertTrue( $page::should_register() );
	}

	/**
	 * Without the plan there is still an upgrade to offer on WoA.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_page_registers_on_woa_without_the_plan( $page ) {
		Constants::set_constant( 'IS_ATOMIC', true );

		$this->assertTrue( $page::should_register() );
	}

	/**
	 * Without the plan, the Jetpack plugin's dashboard is held back so this page gets the slug.
	 */
	public function test_jetpack_dashboard_is_held_back_without_the_plan() {
		$this->assertFalse( WPCOM_Backup::filter_jetpack_backup_dashboard( true ) );
	}

	/**
	 * The Protect dashboard module is offered only to a plan with Scan's UI.
	 *
	 * @param string $granted  The feature the plan includes.
	 * @param bool   $expected Whether the module stays available.
	 *
	 * @dataProvider provide_protect_dashboard_plans
	 */
	#[DataProvider( 'provide_protect_dashboard_plans' )]
	public function test_protect_dashboard_module_needs_self_serve_scan( $granted, $expected ) {
		$this->grant_feature( $granted );

		$modules = WPCOM_Scan::filter_available_modules( array( 'protect-dashboard' => '16.4' ) );

		$this->assertSame( $expected, isset( $modules['protect-dashboard'] ) );
	}

	/**
	 * Data provider for test_protect_dashboard_module_needs_self_serve_scan.
	 *
	 * @return array
	 */
	public static function provide_protect_dashboard_plans() {
		return array(
			'self-serve Scan' => array( \WPCOM_Features::SCAN_SELF_SERVE, true ),
			'SCAN alone'      => array( \WPCOM_Features::SCAN, false ),
		);
	}

	/**
	 * A WordPress.com feature's upgrade goes to the plan upgrade flow and its manage link to WordPress.com; other features keep Jetpack's.
	 *
	 * @dataProvider provide_feature_upgrades
	 *
	 * @param string      $slug             The My Jetpack feature slug.
	 * @param bool        $site_has_feature Whether the site already has it.
	 * @param string|null $plan_feature     The plan feature the upgrade filters on, or null when there is no upgrade.
	 * @param string|null $live             How the link to the live feature should end (`%host%` is the site's), or null for Jetpack's own links.
	 */
	#[DataProvider( 'provide_feature_upgrades' )]
	public function test_feature_upgrade_goes_to_wpcom( $slug, $site_has_feature, $plan_feature, $live ) {
		$jetpack = array(
			'path' => '/add-' . $slug,
			'name' => 'Jetpack',
		);

		$upgrade = WPCOM_Feature_Upgrades::filter_feature_upgrade( $jetpack, $slug, $site_has_feature );

		if ( null === $live ) {
			$this->assertSame( $jetpack, $upgrade );
			return;
		}

		$live = str_replace( '%host%', (string) wp_parse_url( home_url(), PHP_URL_HOST ), $live );

		if ( $site_has_feature ) {
			$this->assertStringEndsWith( $live, $upgrade['manage_url'] );
			return;
		}

		parse_str( (string) wp_parse_url( $upgrade['url'], PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $upgrade['url'] );
		$this->assertSame( $plan_feature, $query['feature'] );
		$this->assertStringEndsWith( $live, $query['redirect_to'] );
		// The flow only honors a Back link on the site's own host, which it reads from siteSlug.
		$this->assertSame( explode( '::', $query['siteSlug'] )[0], wp_parse_url( $query['back_to'], PHP_URL_HOST ) );
	}

	/**
	 * Data provider for test_feature_upgrade_goes_to_wpcom.
	 *
	 * @return array
	 */
	public static function provide_feature_upgrades() {
		return array(
			'backup, no plan'  => array( 'backup', false, 'backups-self-serve', '/wp-admin/admin.php?page=jetpack-backup' ),
			'scan, no plan'    => array( 'protect-dashboard', false, 'scan-self-serve', 'https://wordpress.com/scan/%host%' ),
			'backup, has plan' => array( 'backup', true, null, '/wp-admin/admin.php?page=jetpack-backup' ),
			'scan, has plan'   => array( 'protect-dashboard', true, null, 'https://wordpress.com/scan/%host%' ),
			'another feature'  => array( 'boost', false, null, null ),
		);
	}

	/**
	 * Back returns to the page the link was on, or to the feature's page when that is missing or off this site.
	 *
	 * @dataProvider provide_back_urls
	 *
	 * @param string $back_url The page the link is on; `admin:` prefixes a wp-admin path.
	 * @param string $expected How the flow's `back_to` should end.
	 */
	#[DataProvider( 'provide_back_urls' )]
	public function test_plan_upgrade_goes_back_to_the_linking_page( $back_url, $expected ) {
		if ( str_starts_with( $back_url, 'admin:' ) ) {
			$back_url = admin_url( substr( $back_url, 6 ) );
		}

		parse_str( (string) wp_parse_url( WPCOM_Scan::get_plan_upgrade_url( $back_url ), PHP_URL_QUERY ), $query );

		$this->assertStringEndsWith( $expected, $query['back_to'] );
	}

	/**
	 * Data provider for test_plan_upgrade_goes_back_to_the_linking_page.
	 *
	 * @return array
	 */
	public static function provide_back_urls() {
		return array(
			'from My Jetpack' => array( 'admin:admin.php?page=my-jetpack#/features', '/wp-admin/admin.php?page=my-jetpack#/features' ),
			'no page given'   => array( '', '/wp-admin/admin.php?page=jetpack-protect' ),
			'another site'    => array( 'https://example.net/wp-admin/', '/wp-admin/admin.php?page=jetpack-protect' ),
		);
	}

	/**
	 * The upsell hands the reader a cart, not a plan comparison.
	 */
	public function test_upgrade_url_goes_straight_to_checkout() {
		$url = WPCOM_Backup::get_upgrade_url( 'example.wordpress.com' );

		$this->assertStringContainsString( '/checkout/', $url );
		$this->assertStringContainsString( '/business?', $url );
	}

	/**
	 * Checkout is a detour, not a destination: a buyer who lands anywhere else has
	 * to find their way back to finish activating what they just paid for.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_upgrade_url_returns_the_buyer_to_this_page( $page ) {
		parse_str(
			(string) wp_parse_url( $page::get_upgrade_url( 'example.wordpress.com' ), PHP_URL_QUERY ),
			$args
		);

		$this->assertSame( $page::get_page_url(), rawurldecode( $args['redirect_to'] ) );
	}

	/**
	 * On WoA the purchase makes the feature live and this page steps aside, so the
	 * buyer has to land wherever the feature is served instead.
	 *
	 * @param string      $page     Page class.
	 * @param string|null $expected Where the buyer lands, or null for this page.
	 *
	 * @dataProvider provide_upgrade_landings
	 */
	#[DataProvider( 'provide_upgrade_landings' )]
	public function test_upgrade_url_on_woa_lands_where_the_feature_is_served( $page, $expected ) {
		Constants::set_constant( 'IS_ATOMIC', true );

		parse_str(
			(string) wp_parse_url( $page::get_upgrade_url( 'example.org' ), PHP_URL_QUERY ),
			$args
		);

		$expected = null === $expected
			? $page::get_page_url()
			: str_replace( '%host%', (string) wp_parse_url( home_url(), PHP_URL_HOST ), $expected );

		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $page::get_upgrade_url( 'example.org' ) );
		$this->assertSame( $expected, rawurldecode( $args['redirect_to'] ) );
	}

	/**
	 * Each page, with where a WoA buyer lands, as a template over the site's `%host%`.
	 *
	 * @return array
	 */
	public static function provide_upgrade_landings() {
		return array(
			'Backup, served by the Jetpack plugin' => array( WPCOM_Backup::class, null ),
			'Protect, served by Calypso'           => array( WPCOM_Scan::class, 'https://wordpress.com/scan/%host%' ),
		);
	}

	/**
	 * Without a back URL, checkout's back button falls back to the plans page.
	 */
	public function test_upgrade_url_returns_a_reader_who_backs_out_to_this_page() {
		parse_str(
			(string) wp_parse_url( WPCOM_Backup::get_upgrade_url( 'example.wordpress.com' ), PHP_URL_QUERY ),
			$args
		);

		$this->assertSame( WPCOM_Backup::get_page_url(), rawurldecode( $args['checkoutBackUrl'] ) );
	}

	/**
	 * The code is what the page maps to its own copy, so an entry without one
	 * cannot be rendered and must be dropped.
	 */
	public function test_transfer_errors_keep_codes_and_skip_entries_without_one() {
		$eligibility = array(
			'is_eligible' => false,
			'errors'      => array(
				array(
					'code'    => 'no_business_plan',
					'message' => 'Only sites with an eligible plan can be transferred.',
				),
				array( 'message' => 'Malformed, without a code.' ),
			),
		);

		$errors = WPCOM_Backup::get_transfer_errors( $eligibility );

		$this->assertCount( 1, $errors );
		$this->assertSame( 'no_business_plan', $errors[0]['code'] );
		$this->assertSame(
			'Only sites with an eligible plan can be transferred.',
			$errors[0]['message']
		);
	}

	/**
	 * A code the API sends without a message still has to reach the page, which
	 * has its own copy for every code it recognizes.
	 */
	public function test_transfer_errors_default_a_missing_message_to_empty() {
		$eligibility = array( 'errors' => array( array( 'code' => 'site_graylisted' ) ) );

		$errors = WPCOM_Backup::get_transfer_errors( $eligibility );

		$this->assertCount( 1, $errors );
		$this->assertSame( '', $errors[0]['message'] );
	}

	/**
	 * A null result means the library was unavailable, not that there are errors.
	 */
	public function test_transfer_errors_handles_null_eligibility() {
		$this->assertSame( array(), WPCOM_Backup::get_transfer_errors( null ) );
	}

	/**
	 * Put an administrator on a clean admin menu with the Jetpack parent present.
	 *
	 * Without the parent, get_plugin_page_hookname() falls back to an
	 * "admin_page_" prefix and the hookname stops matching production.
	 *
	 * @return void
	 */
	private function set_up_admin_menu() {
		$GLOBALS['menu']              = array();
		$GLOBALS['submenu']           = array();
		$GLOBALS['admin_page_hooks']  = array();
		$GLOBALS['_registered_pages'] = array();
		$GLOBALS['_parent_pages']     = array();
		$GLOBALS['parent_file']       = '';
		unset( $_GET['page'] );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_hosting_feature_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);

		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );
	}

	/**
	 * Put the request on the Backup page, the way wp-admin/admin.php would.
	 *
	 * Built with WP_Screen::get() rather than set_current_screen(), which would fire
	 * `current_screen` and run other features' callbacks in this shared suite.
	 *
	 * @return void
	 */
	private function set_up_backup_request() {
		$GLOBALS['pagenow']     = 'admin.php';
		$GLOBALS['plugin_page'] = WPCOM_Backup::MENU_SLUG;
		$_GET['page']           = WPCOM_Backup::MENU_SLUG;

		$screen = \WP_Screen::get( self::SCREEN_ID );
		// WP_Screen::get() hands back a cached object, whose ID an earlier test may have aliased.
		$screen->id = self::SCREEN_ID;

		$GLOBALS['current_screen'] = $screen;
	}

	/**
	 * Run the enqueue pass and hand back the initial state it printed.
	 *
	 * @return array|null The state, or null when none was printed.
	 */
	private function printed_initial_state() {
		$handle = WPCOM_Backup::WP_BUILD_PAGE . '-wp-admin-prerequisites';
		$prefix = 'window.' . WPCOM_Backup::INITIAL_STATE_VAR . ' = ';

		// The script registry outlives a test, and with it anything an earlier one added.
		wp_deregister_script( $handle );
		wp_register_script( $handle, 'https://example.org/prerequisites.js', array(), '1', true );

		WPCOM_Backup::enqueue_page_data();

		foreach ( (array) wp_scripts()->get_data( $handle, 'before' ) as $script ) {
			if ( is_string( $script ) && str_starts_with( $script, $prefix ) ) {
				return json_decode( substr( $script, strlen( $prefix ), -1 ), true );
			}
		}

		return null;
	}

	/**
	 * Leave the admin globals as they were found.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset(
			$GLOBALS['current_screen'],
			$GLOBALS['pagenow'],
			$GLOBALS['plugin_page'],
			$_GET['page']
		);
		Constants::clear_constants();
		remove_all_filters( WPCOM_Backup::MODERNIZATION_FILTER );
		WPCOM_Backup::reset();
		WPCOM_Scan::reset();
		\Brain\Monkey\tearDown();

		parent::tear_down();
	}

	/**
	 * The Jetpack plugin registers this slug through Admin_Menu at `admin_menu`
	 * priority 1000, before this page's own hook. Adding a second entry would
	 * leave two.
	 */
	public function test_page_steps_aside_when_another_plugin_owns_the_slug() {
		global $submenu;

		$this->set_up_admin_menu();
		$submenu['jetpack'][] = array( 'VaultPress Backup', 'manage_options', WPCOM_Backup::MENU_SLUG, 'Jetpack VaultPress Backup' );

		WPCOM_Backup::register_page();

		$slugs = array_column( $submenu['jetpack'], 2 );
		$this->assertSame(
			array( WPCOM_Backup::MENU_SLUG ),
			array_values( array_filter( $slugs, static fn ( $slug ) => WPCOM_Backup::MENU_SLUG === $slug ) ),
			'The existing entry should be left exactly as it was found.'
		);
		$this->assertArrayNotHasKey( 4, $submenu['jetpack'][0], 'The existing entry should stay visible.' );
	}

	/**
	 * Protect stays in the sidebar in Scan's place; Backup leaves its entry to the WordPress.com
	 * menu, which links Calypso in its place.
	 *
	 * @param string $page        Page class.
	 * @param bool   $modernized  Whether the Backup modernization filter is on.
	 * @param bool   $hidden      Whether the entry should be hidden.
	 *
	 * @dataProvider provide_sidebar_visibility
	 */
	#[DataProvider( 'provide_sidebar_visibility' )]
	public function test_registered_page_sidebar_visibility( $page, $modernized, $hidden ) {
		global $submenu;

		$this->set_up_admin_menu();
		add_filter( WPCOM_Backup::MODERNIZATION_FILTER, $modernized ? '__return_true' : '__return_false' );

		$page::register_page();

		$items = array_values( array_filter( $submenu['jetpack'], static fn ( $item ) => $page::MENU_SLUG === $item[2] ) );
		$this->assertCount( 1, $items );
		$this->assertSame( $hidden ? 'hide-if-js' : '', $items[0][4] ?? '' );
	}

	/**
	 * Each page, the Backup modernization flag, and whether the entry is hidden.
	 *
	 * @return array[]
	 */
	public static function provide_sidebar_visibility() {
		return array(
			'Backup, modernized'      => array( WPCOM_Backup::class, true, false ),
			'Backup, legacy'          => array( WPCOM_Backup::class, false, false ),
			'Protect, either setting' => array( WPCOM_Scan::class, true, false ),
		);
	}

	/**
	 * Pinned because the value looks arbitrary in isolation and is easy to
	 * "tidy" into something else, and links into the page depend on it.
	 *
	 * @param string $page Page class.
	 * @param string $slug The slug the page must keep.
	 *
	 * @dataProvider provide_pinned_slugs
	 */
	#[DataProvider( 'provide_pinned_slugs' )]
	public function test_menu_slug_is_pinned( $page, $slug ) {
		$this->assertSame( $slug, $page::MENU_SLUG );
	}

	/**
	 * Nothing but this connects the constant to the route's package.json, and a
	 * mismatch degrades silently to a blank page.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_route_declares_the_wp_build_page( $page ) {
		$route = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'routes/' . $page::WP_BUILD_PAGE . '/package.json'
			),
			true
		);

		$this->assertSame( $page::WP_BUILD_PAGE, $route['route']['page'] ?? null );
	}

	/**
	 * The API groups warnings by type; the page renders one flat list.
	 */
	public function test_transfer_warnings_are_flattened_across_groups() {
		$eligibility = array(
			'warnings' => array(
				'subdomain' => array(
					array(
						'id'           => 'wordpress_subdomain',
						'description'  => 'Your site address will change.',
						'domain_names' => array(
							'current' => 'example.wordpress.com',
							'new'     => 'example.wpcomstaging.com',
						),
						'support_url'  => 'https://wordpress.com/support/changing-site-address/',
					),
				),
				'plugins'   => array(
					array(
						'id'          => 'some_plugin',
						'description' => 'A plugin will be deactivated.',
					),
				),
			),
		);

		$warnings = WPCOM_Backup::get_transfer_warnings( $eligibility );

		$this->assertCount( 2, $warnings );
		$this->assertSame( 'wordpress_subdomain', $warnings[0]['id'] );
		$this->assertSame( 'example.wpcomstaging.com', $warnings[0]['domain_names']['new'] );
		$this->assertSame( 'some_plugin', $warnings[1]['id'] );
		$this->assertNull( $warnings[1]['domain_names'] );
	}

	/**
	 * A warning without an id cannot be keyed in the rendered list.
	 */
	public function test_transfer_warnings_skips_entries_without_an_id() {
		$eligibility = array(
			'warnings' => array(
				'subdomain' => array(
					array( 'description' => 'No id, so not renderable.' ),
				),
			),
		);

		$this->assertSame( array(), WPCOM_Backup::get_transfer_warnings( $eligibility ) );
	}

	/**
	 * The page renders support_url as a link.
	 *
	 * @dataProvider provide_support_urls
	 *
	 * @param string $support_url As the API returned it.
	 * @param string $expected    As the page receives it.
	 */
	#[DataProvider( 'provide_support_urls' )]
	public function test_transfer_warnings_pass_only_web_support_urls( $support_url, $expected ) {
		$eligibility = array(
			'warnings' => array(
				'subdomain' => array(
					array(
						'id'          => 'wordpress_subdomain',
						'support_url' => $support_url,
					),
				),
			),
		);

		$this->assertSame( $expected, WPCOM_Backup::get_transfer_warnings( $eligibility )[0]['support_url'] );
	}

	/**
	 * Data provider for test_transfer_warnings_pass_only_web_support_urls.
	 *
	 * @return array[]
	 */
	public static function provide_support_urls() {
		return array(
			'https'      => array( 'https://wordpress.com/support/changing-site-address/', 'https://wordpress.com/support/changing-site-address/' ),
			'javascript' => array( 'javascript:alert(1)', '' ),
			'data'       => array( 'data:text/html,<script>alert(1)</script>', '' ),
		);
	}

	/**
	 * A null result means the library was unavailable, not that there are warnings.
	 */
	public function test_transfer_warnings_handles_null_eligibility() {
		$this->assertSame( array(), WPCOM_Backup::get_transfer_warnings( null ) );
	}

	/**
	 * The old address may not redirect yet when the flow sends the reader back.
	 *
	 * @param string $page     Page class.
	 * @param string $expected Where the reader lands.
	 *
	 * @dataProvider provide_transfer_landings
	 */
	#[DataProvider( 'provide_transfer_landings' )]
	public function test_activate_url_lands_on_the_new_address_when_the_transfer_changes_it( $page, $expected ) {
		$warnings = array(
			array( 'domain_names' => null ),
			array(
				'domain_names' => array(
					'current' => 'example.wordpress.com',
					'new'     => 'example.wpcomstaging.com',
				),
			),
		);

		parse_str( (string) wp_parse_url( $page::get_activate_url( $warnings ), PHP_URL_QUERY ), $args );

		$this->assertSame( $expected, rawurldecode( $args['redirect_to'] ) );
	}

	/**
	 * Each page, with where a transferred site lands.
	 *
	 * @return array
	 */
	public static function provide_transfer_landings() {
		return array(
			'Backup'  => array( WPCOM_Backup::class, 'https://example.wpcomstaging.com/wp-admin/admin.php?page=jetpack-backup' ),
			// Calypso's Scan page until the Jetpack plugin serves jetpack-protect on WoA.
			'Protect' => array( WPCOM_Scan::class, 'https://wordpress.com/scan/example.wpcomstaging.com' ),
		);
	}

	/**
	 * Only a bare hostname is swapped in, so the payload cannot redirect elsewhere.
	 */
	public function test_post_transfer_host_ignores_a_new_address_that_is_not_a_hostname() {
		$warnings = array(
			array(
				'domain_names' => array(
					'current' => 'example.wordpress.com',
					'new'     => 'evil.example/path?x=',
				),
			),
		);

		$this->assertNull( WPCOM_Backup::get_post_transfer_host( $warnings ) );
	}

	/**
	 * The flow needs every argument to initiate, wait for the feature, and come
	 * back; a missing one degrades silently to a half-finished activation.
	 */
	public function test_activate_url_carries_the_transfer_flow_arguments() {
		$url = WPCOM_Backup::get_activate_url();

		$this->assertStringStartsWith( WPCOM_Backup::TRANSFER_FLOW_URL, $url );

		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertSame( (string) get_current_blog_id(), $args['siteId'] );
		$this->assertArrayNotHasKey( 'feature', $args, 'backups-self-serve is plan-gated, so waiting on it never waits.' );
		$this->assertSame( WPCOM_Backup::TRANSFER_CONTEXT, $args['initiate_transfer_context'] );
		$this->assertStringContainsString(
			'page=' . WPCOM_Backup::MENU_SLUG,
			rawurldecode( $args['redirect_to'] )
		);
	}

	/**
	 * Pages are declared, not discovered: wp-build only emits a page's PHP when
	 * it is listed in wpPlugin.pages, and an undeclared page renders blank.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_wp_build_page_is_declared_in_the_package_manifest( $page ) {
		$manifest = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'package.json'
			),
			true
		);

		$pages = $manifest['wpPlugin']['pages'] ?? array();

		$this->assertContains( $page::WP_BUILD_PAGE, $pages );
	}

	/**
	 * The domain lands in a path segment, so it has to be encoded there.
	 */
	public function test_upgrade_url_encodes_the_domain() {
		$this->assertStringContainsString(
			'/checkout/example.com%2Fevil/business',
			WPCOM_Backup::get_upgrade_url( 'example.com/evil' )
		);
	}

	/**
	 * Everything the page can show is decided here and read from this one global,
	 * so a key that stops arriving takes a whole prompt down with it.
	 */
	public function test_initial_state_reaches_the_page_script() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		WPCOM_Backup::register_page();

		$payload = (array) $this->printed_initial_state();

		$this->assertSame(
			array( 'state', 'domain', 'isEligible', 'errors', 'warnings', 'upgradeUrl', 'activateUrl', 'supportUrl', 'hasRevertedTransfer', 'transferFailed' ),
			array_keys( $payload )
		);
		$this->assertSame( WPCOM_Backup::STATE_UPGRADE, $payload['state'] );
		$this->assertSame( wp_parse_url( home_url(), PHP_URL_HOST ), $payload['domain'] );
		$this->assertTrue( $payload['isEligible'] );
	}

	/**
	 * The activation prompt explains blockers and confirms warnings from this
	 * payload alone, so they have to arrive in the shape it reads.
	 */
	public function test_activation_state_carries_the_transfer_eligibility() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		$this->grant_feature( \WPCOM_Features::ATOMIC, \WPCOM_Features::BACKUPS_SELF_SERVE );
		Functions\when( 'A8C\Atomic\Eligibility\get_status_for_site' )->justReturn(
			array(
				'is_eligible' => false,
				'errors'      => array(
					array(
						'code'    => 'email_unverified',
						'message' => 'Confirm your email address.',
					),
				),
				'warnings'    => array(
					'plugins' => array(
						array(
							'id'          => 'plugin_warning',
							'description' => 'Some plugins will be deactivated.',
							'support_url' => 'javascript:alert(1)',
						),
					),
				),
			)
		);
		WPCOM_Backup::register_page();

		$payload = (array) $this->printed_initial_state();

		$this->assertSame( WPCOM_Backup::STATE_ACTIVATE, $payload['state'] );
		$this->assertFalse( $payload['isEligible'] );
		$this->assertSame( 'email_unverified', $payload['errors'][0]['code'] );
		$this->assertSame( 'plugin_warning', $payload['warnings'][0]['id'] );
		$this->assertSame( '', $payload['warnings'][0]['support_url'], 'Only a web URL may become a link.' );
	}

	/**
	 * A missing library is not a failed check; the transfer flow rejects the site if it must.
	 */
	public function test_activation_state_assumes_eligible_when_eligibility_is_unknown() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		$this->grant_feature( \WPCOM_Features::ATOMIC, \WPCOM_Features::BACKUPS_SELF_SERVE );
		WPCOM_Backup::register_page();

		$payload = (array) $this->printed_initial_state();

		$this->assertSame( WPCOM_Backup::STATE_ACTIVATE, $payload['state'] );
		$this->assertTrue( $payload['isEligible'] );
	}
}
