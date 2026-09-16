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
	 * Malformed or empty entries must not produce blank list items.
	 */
	public function test_blocker_messages_extracts_only_populated_messages() {
		$eligibility = array(
			'is_eligible' => false,
			'errors'      => array(
				array(
					'code'    => 'no_business_plan',
					'message' => 'Only sites with an eligible plan can be transferred.',
				),
				array( 'code' => 'malformed_without_message' ),
			),
		);

		$this->assertSame(
			array( 'Only sites with an eligible plan can be transferred.' ),
			wpcom_simple_backup_get_blocker_messages( $eligibility )
		);
	}

	/**
	 * A null result means the library was unavailable, not that there are errors.
	 */
	public function test_blocker_messages_handles_null_eligibility() {
		$this->assertSame( array(), wpcom_simple_backup_get_blocker_messages( null ) );
	}

	/**
	 * Registration makes `?page=` resolve; presence in $submenu is what would
	 * make it visible.
	 */
	public function test_page_is_registered_but_not_in_the_menu() {
		$GLOBALS['menu']              = array();
		$GLOBALS['submenu']           = array();
		$GLOBALS['admin_page_hooks']  = array();
		$GLOBALS['_registered_pages'] = array();
		$GLOBALS['_parent_pages']     = array();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_simple_backup_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);

		// Without the parent, get_plugin_page_hookname() falls back to an
		// "admin_page_" prefix and the hookname stops matching production.
		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );

		wpcom_simple_backup_register_page();

		$this->assertArrayHasKey( 'jetpack_page_jetpack-backup', $GLOBALS['_registered_pages'] );

		$slugs = array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
		$this->assertNotContains( 'jetpack-backup', $slugs );
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
				'subdomains' => array(
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
				'plugins'    => array(
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
				'subdomains' => array(
					array( 'description' => 'No id, so not renderable.' ),
				),
			),
		);

		$this->assertSame( array(), wpcom_simple_backup_get_transfer_warnings( $eligibility ) );
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
	 * The alias is what makes wp-build's enqueue callback fire on a slug it does
	 * not recognise.
	 */
	public function test_screen_id_is_aliased_for_wp_build() {
		$screen = (object) array( 'id' => 'jetpack_page_jetpack-backup' );

		wpcom_simple_backup_alias_screen_id( $screen );

		$this->assertSame( WPCOM_SIMPLE_BACKUP_WP_BUILD_PAGE, $screen->id );
	}
}
