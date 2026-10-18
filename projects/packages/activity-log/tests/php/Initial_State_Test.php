<?php
/**
 * Tests for the Activity Log initial state.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Activity_Log\Initial_State
 */
#[CoversClass( Initial_State::class )]
class Initial_State_Test extends TestCase {

	protected function tearDown(): void {
		remove_all_filters( 'jetpack_activity_log_restore_url_template' );
		remove_all_filters( 'jetpack_activity_log_backup_url_template' );
		parent::tearDown();
	}

	public function test_restore_url_template_defaults_to_empty() {
		$this->assertSame( '', $this->rendered_state()['jetpackStatus']['restoreUrlTemplate'] );
	}

	public function test_restore_url_template_comes_from_the_filter() {
		$template = 'https://example.org/wp-admin/admin.php?page=jetpack-backup&p=%2Frestore%2F{rewindId}';
		add_filter(
			'jetpack_activity_log_restore_url_template',
			function () use ( $template ) {
				return $template;
			}
		);

		$this->assertSame( $template, $this->rendered_state()['jetpackStatus']['restoreUrlTemplate'] );
	}

	public function test_backup_url_template_defaults_to_empty() {
		$this->assertSame( '', $this->rendered_state()['jetpackStatus']['backupUrlTemplate'] );
	}

	public function test_backup_url_template_comes_from_the_filter() {
		$template = 'https://example.org/wp-admin/admin.php?page=jetpack-backup&p=%2F%3Fselected%3D%2522{rewindId}%2522';
		add_filter(
			'jetpack_activity_log_backup_url_template',
			function () use ( $template ) {
				return $template;
			}
		);

		$this->assertSame( $template, $this->rendered_state()['jetpackStatus']['backupUrlTemplate'] );
	}

	/**
	 * The initial state as the page receives it.
	 *
	 * @return array
	 */
	private function rendered_state() {
		$script = ( new Initial_State() )->render();
		return json_decode( substr( $script, strlen( 'var JPACTIVITYLOG_INITIAL_STATE=' ), -1 ), true );
	}
}
