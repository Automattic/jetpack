<?php
/**
 * Tests for the Backup page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Backup;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Tests for the Backup page.
 */
class WPCOM_Backup_Test extends \WorDBless\BaseTestCase {

	/**
	 * Screen ID wp-admin gives this page, from its parent and menu slug.
	 */
	const SCREEN_ID = 'jetpack_page_jetpack-backup';

	/**
	 * Activation needs the plan's hosting platform as well as its backups, as in Calypso.
	 *
	 * @dataProvider provide_features_and_states
	 *
	 * @param string[] $features Features the site's plan includes.
	 * @param string   $expected Expected state.
	 */
	#[DataProvider( 'provide_features_and_states' )]
	public function test_state_follows_the_plan_features( array $features, $expected ) {
		Functions\when( 'wpcom_site_has_feature' )->alias(
			static function ( $feature ) use ( $features ) {
				return in_array( $feature, $features, true );
			}
		);

		$this->assertSame( $expected, WPCOM_Backup::get_state( 1 ) );
	}

	/**
	 * Feature sets and the state each one resolves to.
	 *
	 * @return array[]
	 */
	public static function provide_features_and_states() {
		return array(
			'neither'            => array( array(), WPCOM_Backup::STATE_UPGRADE ),
			'backups only'       => array( array( 'backups-self-serve' ), WPCOM_Backup::STATE_UPGRADE ),
			'atomic only'        => array( array( 'atomic' ), WPCOM_Backup::STATE_UPGRADE ),
			'atomic and backups' => array( array( 'atomic', 'backups-self-serve' ), WPCOM_Backup::STATE_ACTIVATE ),
		);
	}

	/**
	 * A Simple site is never Atomic, so the page always has something to offer —
	 * either the upgrade or the transfer that makes the plan's backups real.
	 */
	public function test_page_registers_on_simple() {
		$this->assertTrue( WPCOM_Backup::should_register() );
	}

	/**
	 * Without the plan there is still an upgrade to offer on WoA.
	 */
	public function test_page_registers_on_woa_without_the_plan() {
		Constants::set_constant( 'IS_ATOMIC', true );

		$this->assertTrue( WPCOM_Backup::should_register() );
	}

	/**
	 * Without the plan, the Jetpack plugin's dashboard is held back so this page gets the slug.
	 */
	public function test_jetpack_dashboard_is_held_back_without_the_plan() {
		$this->assertFalse( WPCOM_Backup::filter_jetpack_backup_dashboard( true ) );
	}

	/**
	 * My Jetpack's Backup upgrade on WoA goes to the WordPress.com plans, and nothing else's does.
	 *
	 * @dataProvider provide_my_jetpack_upgrades
	 *
	 * @param string $slug      The feature slug.
	 * @param bool   $included  Whether the site already pays for it.
	 * @param bool   $to_wpcom  Whether the upgrade should go to the WordPress.com plans.
	 */
	#[DataProvider( 'provide_my_jetpack_upgrades' )]
	public function test_my_jetpack_backup_upgrade_goes_to_wpcom_plans( $slug, $included, $to_wpcom ) {
		$jetpack = array(
			'path' => '/add-backup',
			'name' => 'Jetpack VaultPress Backup',
		);

		$upgrade = WPCOM_Backup::filter_my_jetpack_feature_upgrade( $jetpack, $slug, $included );

		if ( ! $to_wpcom ) {
			$this->assertSame( $jetpack, $upgrade );
			return;
		}

		$this->assertStringStartsWith( 'https://wordpress.com/plans/', $upgrade['url'] );
		$this->assertStringContainsString( 'plan=business-bundle', $upgrade['url'] );
	}

	/**
	 * Data provider for test_my_jetpack_backup_upgrade_goes_to_wpcom_plans.
	 *
	 * @return array
	 */
	public static function provide_my_jetpack_upgrades() {
		return array(
			'backup, no plan'  => array( 'backup', false, true ),
			'backup, has plan' => array( 'backup', true, false ),
			'another feature'  => array( 'boost', false, false ),
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
	 */
	public function test_upgrade_url_returns_the_buyer_to_this_page() {
		parse_str(
			(string) wp_parse_url( WPCOM_Backup::get_upgrade_url( 'example.wordpress.com' ), PHP_URL_QUERY ),
			$args
		);

		$this->assertStringContainsString(
			'page=' . WPCOM_Backup::MENU_SLUG,
			rawurldecode( $args['redirect_to'] )
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
					'user_login' => 'wpcom_backup_admin',
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
	 * Start every test on a site whose plan has no features.
	 *
	 * Mocked rather than left absent: a stub Brain Monkey left behind throws when called unmocked.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		Monkey\setUp();
		Functions\when( 'wpcom_site_has_feature' )->justReturn( false );
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
		Monkey\tearDown();

		parent::tear_down();
	}

	/**
	 * Pinned because the value looks arbitrary in isolation and is easy to
	 * "tidy" into something else.
	 */
	public function test_menu_slug_matches_the_real_backup_page() {
		$this->assertSame( 'jetpack-backup', WPCOM_Backup::MENU_SLUG );
	}

	/**
	 * Nothing but this connects the constant to the route's package.json, and a
	 * mismatch degrades silently to a blank page.
	 */
	public function test_route_declares_the_wp_build_page() {
		$route = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'routes/wpcom-backup/package.json'
			),
			true
		);

		$this->assertSame( WPCOM_Backup::WP_BUILD_PAGE, $route['route']['page'] ?? null );
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
	 */
	public function test_activate_url_returns_to_the_new_address_when_the_transfer_changes_it() {
		$warnings = array(
			array( 'domain_names' => null ),
			array(
				'domain_names' => array(
					'current' => 'example.wordpress.com',
					'new'     => 'example.wpcomstaging.com',
				),
			),
		);

		parse_str( (string) wp_parse_url( WPCOM_Backup::get_activate_url( $warnings ), PHP_URL_QUERY ), $args );

		$this->assertSame(
			'https://example.wpcomstaging.com/wp-admin/admin.php?page=' . WPCOM_Backup::MENU_SLUG,
			rawurldecode( $args['redirect_to'] )
		);
	}

	/**
	 * Only a bare hostname is swapped in, so the payload cannot redirect elsewhere.
	 */
	public function test_post_transfer_url_ignores_a_new_address_that_is_not_a_hostname() {
		$warnings = array(
			array(
				'domain_names' => array(
					'current' => 'example.wordpress.com',
					'new'     => 'evil.example/path?x=',
				),
			),
		);

		$this->assertSame( WPCOM_Backup::get_page_url(), WPCOM_Backup::get_post_transfer_page_url( $warnings ) );
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
	 */
	public function test_wp_build_page_is_declared_in_the_package_manifest() {
		$manifest = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'package.json'
			),
			true
		);

		$pages = $manifest['wpPlugin']['pages'] ?? array();

		$this->assertContains( WPCOM_Backup::WP_BUILD_PAGE, $pages );
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
			array( 'state', 'domain', 'isEligible', 'errors', 'warnings', 'upgradeUrl', 'activateUrl' ),
			array_keys( $payload )
		);
		$this->assertSame( WPCOM_Backup::STATE_UPGRADE, $payload['state'] );
		$this->assertSame( wp_parse_url( home_url(), PHP_URL_HOST ), $payload['domain'] );
		$this->assertTrue( $payload['isEligible'] );
	}
}
