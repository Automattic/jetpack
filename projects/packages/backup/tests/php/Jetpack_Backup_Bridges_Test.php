<?php
/**
 * Unit tests for the new Jetpack_Backup overview bridges
 * (activity-log, ls, path-info, file-url, file-content, download,
 * download/progress, filtered/prepare, filtered/status, extension-url).
 *
 * Focuses on the shared shape: admin-only permission callback +
 * WP_Error pass-through when the upstream call to WPCOM can't be made
 * (no connected user/token in the test environment, so the auth check
 * inside `Client::wpcom_json_api_request_as_user` exercises the same
 * error path the bridges hit on real transport failures).
 *
 * @package automattic/jetpack-backup
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0005;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Request;

class Jetpack_Backup_Bridges_Test extends TestCase {

	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * The permission callback gates every new bridge. Admins must be
	 * allowed; everyone else must not.
	 */
	public function test_backups_permissions_callback_allows_admin() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'bridge_admin',
				'user_pass'  => 'bridge_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$this->assertTrue( Jetpack_Backup::backups_permissions_callback() );
	}

	public function test_backups_permissions_callback_denies_subscriber() {
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'bridge_sub',
				'user_pass'  => 'sub_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$this->assertFalse( Jetpack_Backup::backups_permissions_callback() );
	}

	public function test_backups_permissions_callback_denies_anonymous() {
		wp_set_current_user( 0 );

		$this->assertFalse( Jetpack_Backup::backups_permissions_callback() );
	}

	/**
	 * The activity-log bridge must surface a WP_Error rather than
	 * throwing or returning malformed data when the upstream call
	 * can't complete.
	 */
	public function test_get_site_backup_activity_log_returns_wp_error_when_upstream_fails() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/backup/activity-log' );
		$result  = Jetpack_Backup::get_site_backup_activity_log( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * Same WP_Error contract for the file-listing bridge.
	 */
	public function test_get_site_backup_ls_returns_wp_error_when_upstream_fails() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/backup/ls' );
		$request->set_param( 'rewind_id', '1700000000' );
		$request->set_param( 'path', '/' );
		$result = Jetpack_Backup::get_site_backup_ls( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * Same WP_Error contract for the download initiator (POST bridge).
	 */
	public function test_initiate_site_backup_download_returns_wp_error_when_upstream_fails() {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/download' );
		$request->set_param( 'rewindId', '1700000000' );
		$result = Jetpack_Backup::initiate_site_backup_download( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * Same WP_Error contract for the restore initiator (POST bridge).
	 */
	public function test_initiate_site_backup_restore_returns_wp_error_when_upstream_fails() {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/backup/restore' );
		$request->set_param( 'rewind_id', '1700000000' );
		$result = Jetpack_Backup::initiate_site_backup_restore( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * Restore progress poll returns WP_Error when the upstream call can't
	 * complete — the front-end relies on this to surface a user-facing
	 * error rather than spinning forever.
	 */
	public function test_get_site_backup_restore_progress_returns_wp_error_when_upstream_fails() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/site/backup/restore/progress' );
		$request->set_param( 'restore_id', 1 );
		$result = Jetpack_Backup::get_site_backup_restore_progress( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
	}
}
