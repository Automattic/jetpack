<?php
/**
 * Tests for the Reprint export Activity Log entries.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Reprint_Export\Activity_Log;
use Automattic\Jetpack\Reprint_Export\Reprint_Exporter;
use Automattic\Jetpack\Sync\Activity_Log_Event;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests the Activity_Log class.
 *
 * @covers \Automattic\Jetpack\Reprint_Export\Activity_Log
 */
#[CoversClass( Activity_Log::class )]
class Reprint_Activity_Log_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_all_actions( 'jetpack_reprint_export_event' );
		parent::tear_down();
	}

	/**
	 * The payloads of every Activity Log entry written so far.
	 *
	 * @return array[]
	 */
	private function logged_entries() {
		$posts = get_posts(
			array(
				'post_type'   => Activity_Log_Event::POST_TYPE,
				'post_status' => 'any',
				'numberposts' => -1,
				'orderby'     => 'ID',
				'order'       => 'ASC',
			)
		);

		return array_map( fn( $post ) => json_decode( $post->post_content, true ), $posts );
	}

	/**
	 * Exporter events reach the log once maybe_init() has run.
	 */
	public function test_maybe_init_logs_exporter_events() {
		$user_id = $this->factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_login' => 'reprint_admin',
			)
		);

		Reprint_Exporter::maybe_init();
		Reprint_Exporter::record_event( 'window_opened', array( 'user_id' => $user_id ) );

		$entries = $this->logged_entries();
		$this->assertCount( 1, $entries );
		$this->assertSame( 'warning', $entries[0]['severity'] );
		$this->assertSame( Activity_Log::SOURCE, $entries[0]['source'] );
		$this->assertStringContainsString( 'reprint_admin', $entries[0]['content'] );
	}

	/**
	 * Per-request events are logged once per throttle window, not once per request.
	 *
	 * @dataProvider provide_throttled_events
	 * @param string $event Event name.
	 */
	#[DataProvider( 'provide_throttled_events' )]
	public function test_per_request_events_are_throttled( $event ) {
		Activity_Log::init();

		for ( $i = 0; $i < 3; $i++ ) {
			Reprint_Exporter::record_event( $event, array( 'code' => 403 ) );
		}
		$this->assertCount( 1, $this->logged_entries() );

		delete_transient( Activity_Log::THROTTLE_TRANSIENT_PREFIX . $event );
		Reprint_Exporter::record_event( $event, array( 'code' => 403 ) );
		$this->assertCount( 2, $this->logged_entries(), 'Once the window passes, the next request is logged.' );
	}

	/**
	 * Data provider for test_per_request_events_are_throttled.
	 *
	 * @return array
	 */
	public static function provide_throttled_events() {
		return array(
			'served'  => array( 'export_served' ),
			'refused' => array( 'export_refused' ),
		);
	}
}
