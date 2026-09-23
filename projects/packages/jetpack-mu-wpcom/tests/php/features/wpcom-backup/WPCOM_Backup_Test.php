<?php
/**
 * Tests for the Backup page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Backup;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-backup/wpcom-backup.php';

/**
 * Tests for the Backup page.
 */
class WPCOM_Backup_Test extends \WorDBless\BaseTestCase {

	/**
	 * Screen ID wp-admin gives this page, from its parent and menu slug.
	 */
	const SCREEN_ID = 'jetpack_page_jetpack-backup';

	/**
	 * An environment that cannot prove the site has backups must not offer to
	 * activate them.
	 */
	public function test_state_defaults_to_upgrade_without_wpcom_libraries() {
		$this->assertSame(
			WPCOM_Backup::STATE_UPGRADE,
			WPCOM_Backup::get_state( 1 )
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
		remove_action( 'admin_head', array( WPCOM_Backup::class, 'hide_menu_entry' ), 0 );
		Constants::clear_constants();
		WPCOM_Backup::reset();

		parent::tear_down();
	}

	/**
	 * The Jetpack plugin registers this slug through Admin_Menu at `admin_menu`
	 * priority 1000, before this page's own hook. Adding a second entry would
	 * leave two, and hide_menu_entry() would drop theirs rather than ours —
	 * deleting a correctly sorted entry and leaving ours in the wrong tier.
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
	}

	/**
	 * Routing resolves the render hook by searching $submenu for the page, so
	 * removing the entry too early stops the page rendering at all.
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
	 * The entry has to be gone before menu-header.php prints the sidebar.
	 */
	public function test_menu_entry_is_hidden_by_admin_head() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();

		WPCOM_Backup::register_page();

		$this->assertSame(
			0,
			has_action( 'admin_head', array( WPCOM_Backup::class, 'hide_menu_entry' ) ),
			'Hiding must be hooked before menu-header.php prints.'
		);

		WPCOM_Backup::hide_menu_entry();

		$slugs = array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
		$this->assertNotContains( WPCOM_Backup::MENU_SLUG, $slugs );
	}

	/**
	 * Off the Backup page nothing needs the entry, so it goes immediately —
	 * admin_head never fires on the REST requests that build the wpcom sidebar.
	 */
	public function test_menu_entry_is_hidden_immediately_elsewhere() {
		$this->set_up_admin_menu();

		WPCOM_Backup::register_page();

		$slugs = array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
		$this->assertNotContains( WPCOM_Backup::MENU_SLUG, $slugs );
		$this->assertArrayHasKey( self::SCREEN_ID, $GLOBALS['_registered_pages'] );
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
	public function test_render_callback_matches_the_wp_build_page_name() {
		$route = (array) json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'routes/wpcom-backup/package.json'
			),
			true
		);
		$page  = isset( $route['route']['page'] ) ? (string) $route['route']['page'] : '';

		$this->assertSame( WPCOM_Backup::WP_BUILD_PAGE, $page );
		$this->assertSame(
			WPCOM_Backup::RENDER_CALLBACK,
			'jetpack_mu_wpcom_' . str_replace( '-', '_', $page ) . '_wp_admin_render_page'
		);
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
	public function test_ajax_requests_are_not_backup_page_requests() {
		$this->set_up_backup_request();
		$GLOBALS['pagenow'] = 'admin-ajax.php';

		$this->assertFalse( WPCOM_Backup::is_backup_admin_request() );
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
			array( 'state', 'domain', 'isEligible', 'errors', 'warnings', 'upgradeUrl', 'activateUrl', 'supportUrl' ),
			array_keys( $payload )
		);
		$this->assertSame( WPCOM_Backup::STATE_UPGRADE, $payload['state'] );
		$this->assertSame( wp_parse_url( home_url(), PHP_URL_HOST ), $payload['domain'] );
		// wp_localize_script() stringifies scalars, so the page reads "1" and "" for the flag.
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
					'user_login' => 'wpcom_backup_subscriber',
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
