<?php
/**
 * Unit tests for the Activity Log initial state.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\TestCase;

class Initial_State_Test extends TestCase {

	protected function tearDown(): void {
		Constants::clear_constants();
		Status_Cache::clear();
		unset( $GLOBALS['activity_log_test_wpcom_features'] );
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_activity_log_restore_url_template' );
		remove_all_filters( 'jetpack_activity_log_backup_url_template' );
		parent::tearDown();
	}

	/**
	 * Decodes the payload render() assigns to the global.
	 *
	 * @return array
	 */
	private function get_rendered_state() {
		$script = ( new Initial_State() )->render();
		$json   = substr( $script, strlen( 'var JPACTIVITYLOG_INITIAL_STATE=' ), -1 );

		return json_decode( $json, true );
	}

	/**
	 * Simple has no Jetpack REST API or connection, so the proxy and Jetpack checkout would both break there.
	 */
	public function test_config_switches_to_wordpress_com_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'activity_log_simple_viewer',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$config = $this->get_rendered_state()['config'];

		$this->assertSame( 'wpcom', $config['apiSource'] );
		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade/?siteSlug=', $config['wpcomUpgradeUrl'] );
		$this->assertSame(
			array(
				'userid'   => $user_id,
				'username' => 'activity_log_simple_viewer',
			),
			$config['tracksUserData']
		);
	}

	/**
	 * A Simple site that was once Atomic keeps its backup events, which Calypso hides once backups are gone.
	 */
	public function test_wpcom_simple_hides_backup_groups_only_without_backups() {
		require_once __DIR__ . '/mocks/wpcom-features-mock.php';
		Constants::set_constant( 'IS_WPCOM', true );

		$without_backups                             = $this->get_rendered_state()['config']['hiddenGroups'];
		$GLOBALS['activity_log_test_wpcom_features'] = array( 'backups-self-serve' );
		$with_backups                                = $this->get_rendered_state()['config']['hiddenGroups'];

		$this->assertSame( array( 'rewind', 'scan' ), $without_backups );
		$this->assertSame( array(), $with_backups );
	}

	public function test_config_marks_known_threats_available_only_on_woa() {
		$this->assertFalse( $this->get_rendered_state()['config']['knownThreatsAvailable'] );

		Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();

		$this->assertTrue( $this->get_rendered_state()['config']['knownThreatsAvailable'] );
	}

	public function test_restore_url_template_defaults_to_empty() {
		$this->assertSame( '', $this->get_rendered_state()['jetpackStatus']['restoreUrlTemplate'] );
	}

	public function test_restore_url_template_comes_from_the_filter() {
		$template = 'https://example.org/wp-admin/admin.php?page=jetpack-backup&p=%2Frestore%2F{rewindId}';
		add_filter(
			'jetpack_activity_log_restore_url_template',
			function () use ( $template ) {
				return $template;
			}
		);

		$this->assertSame( $template, $this->get_rendered_state()['jetpackStatus']['restoreUrlTemplate'] );
	}

	public function test_backup_url_template_defaults_to_empty() {
		$this->assertSame( '', $this->get_rendered_state()['jetpackStatus']['backupUrlTemplate'] );
	}

	public function test_backup_url_template_comes_from_the_filter() {
		$template = 'https://example.org/wp-admin/admin.php?page=jetpack-backup&p=%2F%3Fselected%3D%2522{rewindId}%2522';
		add_filter(
			'jetpack_activity_log_backup_url_template',
			function () use ( $template ) {
				return $template;
			}
		);

		$this->assertSame( $template, $this->get_rendered_state()['jetpackStatus']['backupUrlTemplate'] );
	}
}
