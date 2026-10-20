<?php
/**
 * Unit tests for the Activity Log initial state.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

class Initial_State_Test extends TestCase {

	protected function tearDown(): void {
		Constants::clear_single_constant( 'IS_WPCOM' );
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
