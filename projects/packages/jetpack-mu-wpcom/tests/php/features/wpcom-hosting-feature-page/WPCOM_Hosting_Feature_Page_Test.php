<?php
/**
 * Tests for the hosting feature pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Backup;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Hosting_Feature_Page;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Scan;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-scan/wpcom-scan.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Tests for the hosting feature pages. Shared behavior is exercised through the Backup page.
 */
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
	 * transfer checks, on a Simple site with no transfer underway.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		// Some earlier suites never tear Brain Monkey down, and a leftover stub would block this one.
		\Brain\Monkey\tearDown();
		\Brain\Monkey\setUp();
		$this->grant_feature( '' );
		Functions\when( 'A8C\Atomic\has_site_pending_automated_transfer' )->justReturn( false );
		Functions\when( 'A8C\Atomic\is_wpcom_atomic' )->justReturn( false );
		Functions\when( 'A8C\Atomic\Eligibility\get_status_for_site' )->justReturn( null );
	}

	/**
	 * Give the site exactly one plan feature.
	 *
	 * @param string $granted The feature the plan includes.
	 * @return void
	 */
	private function grant_feature( $granted ) {
		Functions\when( 'wpcom_site_has_feature' )->alias(
			static function ( $feature ) use ( $granted ) {
				return $granted === $feature;
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
		$this->grant_feature( $feature );

		$this->assertSame( WPCOM_Hosting_Feature_Page::STATE_ACTIVATE, $page::get_state( 1 ) );
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
		$this->grant_feature( \WPCOM_Features::BACKUPS_SELF_SERVE );
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
	 * Run the enqueue pass and hand back what it localized for the page script.
	 *
	 * @return array|null The payload, or null when nothing was localized.
	 */
	private function localized_initial_state() {
		$handle = WPCOM_Backup::WP_BUILD_PAGE . '-wp-admin-prerequisites';

		// The script registry outlives a test, and with it anything an earlier one localized.
		wp_deregister_script( $handle );
		wp_register_script( $handle, 'https://example.org/prerequisites.js', array(), '1', true );

		WPCOM_Backup::enqueue_initial_state();

		$data  = wp_scripts()->get_data( $handle, 'data' );
		$start = is_string( $data ) ? strpos( $data, '{' ) : false;

		if ( false === $start ) {
			return null;
		}

		return json_decode( substr( (string) $data, $start, -1 ), true );
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
	 * Hidden by the page itself, since admins without a linked WordPress.com account never
	 * load the WordPress.com menu that hides the rest of the Jetpack entries.
	 *
	 * @param string $page Page class.
	 *
	 * @dataProvider provide_pages
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_registered_page_is_hidden_from_the_sidebar( $page ) {
		global $submenu;

		$this->set_up_admin_menu();

		$page::register_page();

		$items = array_values( array_filter( $submenu['jetpack'], static fn ( $item ) => $page::MENU_SLUG === $item[2] ) );
		$this->assertCount( 1, $items );
		$this->assertSame( 'hide-if-js', $items[0][4] ?? '' );
	}

	/**
	 * Routing resolves the render hook by searching $submenu for the page.
	 */
	public function test_page_hook_still_resolves_on_the_backup_request() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();

		WPCOM_Backup::register_page();

		$this->assertSame(
			'jetpack_page_' . WPCOM_Backup::MENU_SLUG,
			get_plugin_page_hook( WPCOM_Backup::MENU_SLUG, 'admin.php' )
		);
	}

	/**
	 * Registration must land between Jetpack's Admin_Menu and the WordPress.com menu's hide pass.
	 */
	public function test_page_registers_between_admin_menu_and_the_wpcom_menu_hide() {
		remove_action( 'admin_menu', array( WPCOM_Backup::class, 'register_page' ), WPCOM_Backup::REGISTER_PRIORITY );

		WPCOM_Backup::init();
		$priority = has_action( 'admin_menu', array( WPCOM_Backup::class, 'register_page' ) );

		$this->assertGreaterThan( 1000, $priority );
		$this->assertLessThan( has_action( 'admin_menu', 'wpcom_add_jetpack_submenu' ), $priority );
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
	public function test_render_callback_matches_the_wp_build_page_name( $page ) {
		$route = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'routes/' . $page::WP_BUILD_PAGE . '/package.json'
			),
			true
		);
		$name  = isset( $route['route']['page'] ) ? (string) $route['route']['page'] : '';

		$this->assertSame( $page::WP_BUILD_PAGE, $name );
		$this->assertSame(
			$page::RENDER_CALLBACK,
			'jetpack_mu_wpcom_' . str_replace( '-', '_', $name ) . '_wp_admin_render_page'
		);
	}

	/**
	 * Registration state is per page, so one page claiming its slug must not make
	 * another alias the screen or localize state for a page it never registered.
	 */
	public function test_one_page_registering_does_not_make_another_own_its_slug() {
		$this->set_up_admin_menu();

		WPCOM_Backup::register_page();

		$this->assertTrue( WPCOM_Backup::owns_page() );
		$this->assertFalse( WPCOM_Scan::owns_page() );
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
	 * The alias is what makes wp-build's enqueue callback fire on a slug it does
	 * not recognise.
	 */
	public function test_screen_id_is_aliased_for_wp_build() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		WPCOM_Backup::register_page();

		WPCOM_Backup::alias_screen_id();

		$this->assertSame( WPCOM_Backup::WP_BUILD_PAGE, get_current_screen()->id );
	}

	/**
	 * Anything reading the screen after the enqueue pass — the page-view tracker
	 * among them — has to see the real ID, not the one wp-build needed.
	 */
	public function test_screen_id_is_restored_after_the_enqueue_pass() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		WPCOM_Backup::register_page();

		WPCOM_Backup::alias_screen_id();
		WPCOM_Backup::restore_screen_id();

		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	/**
	 * Aliasing the screen of a page another plugin serves would break its own
	 * asset loading, which keys off the screen ID.
	 */
	public function test_screen_id_is_left_alone_when_another_plugin_owns_the_page() {
		$this->set_up_backup_request();

		WPCOM_Backup::alias_screen_id();

		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	/**
	 * Requests to admin-ajax.php are also `is_admin()`, and a stray `page` arg
	 * there must not drag in the wp-build assets for a page that never renders.
	 */
	public function test_ajax_requests_are_not_page_requests() {
		$this->set_up_backup_request();
		$GLOBALS['pagenow'] = 'admin-ajax.php';

		$this->assertFalse( WPCOM_Backup::is_page_request() );
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

		$payload = (array) $this->localized_initial_state();

		$this->assertSame(
			array( 'state', 'domain', 'isEligible', 'errors', 'warnings', 'upgradeUrl', 'activateUrl' ),
			array_keys( $payload )
		);
		$this->assertSame( WPCOM_Backup::STATE_UPGRADE, $payload['state'] );
		$this->assertSame( wp_parse_url( home_url(), PHP_URL_HOST ), $payload['domain'] );
		// wp_localize_script() stringifies scalars, so the page reads "1" and "" for the flag.
		$this->assertSame( '1', $payload['isEligible'] );
	}

	/**
	 * The activation prompt explains blockers and confirms warnings from this
	 * payload alone, so they have to arrive in the shape it reads.
	 */
	public function test_activation_state_carries_the_transfer_eligibility() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		$this->grant_feature( \WPCOM_Features::BACKUPS_SELF_SERVE );
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

		$payload = (array) $this->localized_initial_state();

		$this->assertSame( WPCOM_Backup::STATE_ACTIVATE, $payload['state'] );
		$this->assertSame( '', $payload['isEligible'] );
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
		$this->grant_feature( \WPCOM_Features::BACKUPS_SELF_SERVE );
		WPCOM_Backup::register_page();

		$payload = (array) $this->localized_initial_state();

		$this->assertSame( WPCOM_Backup::STATE_ACTIVATE, $payload['state'] );
		$this->assertSame( '1', $payload['isEligible'] );
	}

	/**
	 * Eligibility is fetched directly here rather than through the wpcom endpoint
	 * that gates it, so the capability check has to be restated.
	 */
	public function test_initial_state_is_withheld_from_users_who_cannot_manage_options() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		WPCOM_Backup::register_page();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_hosting_feature_subscriber',
					'user_pass'  => 'password',
					'role'       => 'subscriber',
				)
			)
		);

		$this->assertNull( $this->localized_initial_state() );
	}

	/**
	 * When the Jetpack plugin owns the slug it renders its own Backup page, which
	 * would be handed a state describing a page it is not showing.
	 */
	public function test_initial_state_is_withheld_when_another_plugin_owns_the_page() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();
		$GLOBALS['submenu']['jetpack'][] = array( 'VaultPress Backup', 'manage_options', WPCOM_Backup::MENU_SLUG, 'Jetpack VaultPress Backup' );

		WPCOM_Backup::register_page();

		$this->assertNull( $this->localized_initial_state() );
	}
}
