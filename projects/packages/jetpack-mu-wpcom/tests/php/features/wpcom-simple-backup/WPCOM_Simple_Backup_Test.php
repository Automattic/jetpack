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
		global $menu, $submenu, $admin_page_hooks, $_registered_pages, $_parent_pages;

		$menu              = array();
		$submenu           = array();
		$admin_page_hooks  = array();
		$_registered_pages = array();
		$_parent_pages     = array();

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

		$this->assertArrayHasKey( 'jetpack_page_jetpack-backup', $_registered_pages );

		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );
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
		$route = json_decode(
			(string) file_get_contents(
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'routes/wpcom-backup/package.json'
			),
			true
		);

		$this->assertSame( WPCOM_SIMPLE_BACKUP_WP_BUILD_PAGE, $route['route']['page'] );
		$this->assertSame(
			WPCOM_SIMPLE_BACKUP_RENDER_CALLBACK,
			'jetpack_mu_wpcom_' . str_replace( '-', '_', $route['route']['page'] ) . '_wp_admin_render_page'
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
