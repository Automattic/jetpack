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
		unset( $GLOBALS['activity_log_test_wpcom_features'] );
		wp_set_current_user( 0 );
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
}
