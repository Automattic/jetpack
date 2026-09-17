<?php
/**
 * Tests for the Simple-site Backup page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-simple-backup/wpcom-simple-backup.php';

/**
 * Tests for the Simple-site Backup page.
 */
class WPCOM_Simple_Backup_Test extends \WorDBless\BaseTestCase {

	/**
	 * An environment that cannot prove the site has backups must not offer to
	 * activate them.
	 */
	public function test_state_defaults_to_upgrade_without_wpcom_libraries() {
		$this->assertSame(
			WPCOM_SIMPLE_BACKUP_STATE_UPGRADE,
			wpcom_simple_backup_get_state( 1, 1 )
		);
	}

	/**
	 * Each prompt has to be previewable on a sandbox without arranging real state.
	 */
	public function test_state_is_filterable() {
		add_filter(
			'wpcom_simple_backup_state',
			function () {
				return WPCOM_SIMPLE_BACKUP_STATE_IN_PROGRESS;
			}
		);

		$this->assertSame(
			WPCOM_SIMPLE_BACKUP_STATE_IN_PROGRESS,
			wpcom_simple_backup_get_state( 1, 1 )
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

		$errors = wpcom_simple_backup_get_transfer_errors( $eligibility );

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

		$errors = wpcom_simple_backup_get_transfer_errors( $eligibility );

		$this->assertCount( 1, $errors );
		$this->assertSame( '', $errors[0]['message'] );
	}

	/**
	 * Each error state has to be previewable on a sandbox without arranging a
	 * site that actually fails the check.
	 */
	public function test_transfer_errors_are_filterable() {
		add_filter(
			'wpcom_simple_backup_transfer_errors',
			function () {
				return array(
					array(
						'code'    => 'email_unverified',
						'message' => 'Email address is not confirmed.',
					),
				);
			}
		);

		$errors = wpcom_simple_backup_get_transfer_errors( null );

		$this->assertCount( 1, $errors );
		$this->assertSame( 'email_unverified', $errors[0]['code'] );
	}

	/**
	 * A null result means the library was unavailable, not that there are errors.
	 */
	public function test_transfer_errors_handles_null_eligibility() {
		$this->assertSame( array(), wpcom_simple_backup_get_transfer_errors( null ) );
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
					'user_login' => 'wpcom_simple_backup_admin',
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
	 * Calling set_current_screen() would fire `current_screen`, running other
	 * features' callbacks in this shared suite; is_admin() only needs in_admin().
	 *
	 * @return void
	 */
	private function set_up_backup_request() {
		$GLOBALS['current_screen'] = new class() {
			/**
			 * Whether the request is in the admin.
			 *
			 * @return bool
			 */
			public function in_admin() {
				return true;
			}
		};

		$GLOBALS['pagenow']     = 'admin.php';
		$GLOBALS['plugin_page'] = WPCOM_SIMPLE_BACKUP_MENU_SLUG;
		$_GET['page']           = WPCOM_SIMPLE_BACKUP_MENU_SLUG;
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
		remove_action( 'admin_head', 'wpcom_simple_backup_hide_menu_entry', 0 );

		parent::tear_down();
	}

	/**
	 * Routing resolves the render hook by searching $submenu for the page, so
	 * removing the entry too early stops the page rendering at all.
	 */
	public function test_page_hook_still_resolves_on_the_backup_request() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();

		wpcom_simple_backup_register_page();

		$this->assertSame(
			'jetpack_page_' . WPCOM_SIMPLE_BACKUP_MENU_SLUG,
			get_plugin_page_hook( WPCOM_SIMPLE_BACKUP_MENU_SLUG, 'admin.php' )
		);
	}

	/**
	 * The entry has to be gone before menu-header.php prints the sidebar.
	 */
	public function test_menu_entry_is_hidden_by_admin_head() {
		$this->set_up_admin_menu();
		$this->set_up_backup_request();

		wpcom_simple_backup_register_page();

		$this->assertSame(
			0,
			has_action( 'admin_head', 'wpcom_simple_backup_hide_menu_entry' ),
			'Hiding must be hooked before menu-header.php prints.'
		);

		wpcom_simple_backup_hide_menu_entry();

		$slugs = array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
		$this->assertNotContains( WPCOM_SIMPLE_BACKUP_MENU_SLUG, $slugs );
	}

	/**
	 * Off the Backup page nothing needs the entry, so it goes immediately —
	 * admin_head never fires on the REST requests that build the wpcom sidebar.
	 */
	public function test_menu_entry_is_hidden_immediately_elsewhere() {
		$this->set_up_admin_menu();

		wpcom_simple_backup_register_page();

		$slugs = array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
		$this->assertNotContains( WPCOM_SIMPLE_BACKUP_MENU_SLUG, $slugs );
		$this->assertArrayHasKey( 'jetpack_page_jetpack-backup', $GLOBALS['_registered_pages'] );
	}

	/**
	 * Pinned because the value looks arbitrary in isolation and is easy to
	 * "tidy" into something else.
	 */
	public function test_menu_slug_matches_the_real_backup_page() {
		$this->assertSame( 'jetpack-backup', WPCOM_SIMPLE_BACKUP_MENU_SLUG );
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

		$this->assertSame( WPCOM_SIMPLE_BACKUP_WP_BUILD_PAGE, $page );
		$this->assertSame(
			WPCOM_SIMPLE_BACKUP_RENDER_CALLBACK,
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

		$warnings = wpcom_simple_backup_get_transfer_warnings( $eligibility );

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

		$this->assertSame( array(), wpcom_simple_backup_get_transfer_warnings( $eligibility ) );
	}

	/**
	 * The confirmation has to be previewable without a site whose address changes.
	 */
	public function test_transfer_warnings_are_filterable() {
		add_filter(
			'wpcom_simple_backup_transfer_warnings',
			function () {
				return array(
					array(
						'id'          => 'forced',
						'description' => 'Forced.',
					),
				);
			}
		);

		$warnings = wpcom_simple_backup_get_transfer_warnings( null );

		$this->assertCount( 1, $warnings );
		$this->assertSame( 'forced', $warnings[0]['id'] );
	}

	/**
	 * A null result means the library was unavailable, not that there are warnings.
	 */
	public function test_transfer_warnings_handles_null_eligibility() {
		$this->assertSame( array(), wpcom_simple_backup_get_transfer_warnings( null ) );
	}

	/**
	 * The flow needs every argument to initiate, wait for the feature, and come
	 * back; a missing one degrades silently to a half-finished activation.
	 */
	public function test_activate_url_carries_the_transfer_flow_arguments() {
		$url = wpcom_simple_backup_get_activate_url();

		$this->assertStringStartsWith( WPCOM_SIMPLE_BACKUP_TRANSFER_FLOW_URL, $url );

		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertSame( (string) get_current_blog_id(), $args['siteId'] );
		$this->assertSame( WPCOM_SIMPLE_BACKUP_TRANSFER_FEATURE, $args['feature'] );
		$this->assertSame( WPCOM_SIMPLE_BACKUP_TRANSFER_CONTEXT, $args['initiate_transfer_context'] );
		$this->assertStringContainsString(
			'page=' . WPCOM_SIMPLE_BACKUP_MENU_SLUG,
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

		$this->assertContains( WPCOM_SIMPLE_BACKUP_WP_BUILD_PAGE, $pages );
	}

	/**
	 * The alias is what makes wp-build's enqueue callback fire on a slug it does
	 * not recognise.
	 */
	public function test_screen_id_is_aliased_for_wp_build() {
		$screen = (object) array( 'id' => 'jetpack_page_jetpack-backup' );

		wpcom_simple_backup_alias_screen_id( $screen );

		$this->assertSame( WPCOM_SIMPLE_BACKUP_WP_BUILD_PAGE, $screen->id );
	}
}
