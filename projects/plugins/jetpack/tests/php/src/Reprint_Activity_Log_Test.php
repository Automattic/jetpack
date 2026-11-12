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
	 * REMOTE_ADDR before the test.
	 *
	 * @var string|null
	 */
	private $original_remote_addr;

	/**
	 * Test set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->original_remote_addr = $_SERVER['REMOTE_ADDR'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- Restored verbatim in tear_down().
		$_SERVER['REMOTE_ADDR']     = '81.229.206.253';
	}

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_all_actions( 'jetpack_reprint_export_event' );
		if ( null === $this->original_remote_addr ) {
			unset( $_SERVER['REMOTE_ADDR'] );
		} else {
			$_SERVER['REMOTE_ADDR'] = $this->original_remote_addr;
		}
		parent::tear_down();
	}

	/**
	 * Records a served export request from the given client IP.
	 *
	 * @param string $ip Client IP.
	 */
	private function serve_from( $ip ) {
		$_SERVER['REMOTE_ADDR'] = $ip;
		Reprint_Exporter::record_event( 'export_served', array( 'endpoint' => 'sql_chunk' ) );
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
		Reprint_Exporter::maybe_init();
		Reprint_Exporter::record_event( 'public_key_installed' );

		$entries = $this->logged_entries();
		$this->assertCount( 1, $entries );
		$this->assertSame( 'Migration key added', $entries[0]['title'] );
		$this->assertSame( 'jetpack', $entries[0]['source'] );
	}

	/**
	 * Served requests are logged once per client IP within a migration, not once per request.
	 *
	 * @dataProvider provide_migration_start_events
	 * @param string $start_event Event that starts a new migration.
	 */
	#[DataProvider( 'provide_migration_start_events' )]
	public function test_served_requests_are_logged_once_per_ip_per_migration( $start_event ) {
		Activity_Log::init();

		for ( $i = 0; $i < 3; $i++ ) {
			$this->serve_from( '81.229.206.253' );
		}
		$this->assertCount( 1, $this->logged_entries() );
		$this->assertSame( 'Site export from IP Address 81.229.206.253', $this->logged_entries()[0]['content'] );

		$this->serve_from( '203.0.113.7' );
		$this->assertCount( 2, $this->logged_entries(), 'A second client in the same migration is logged.' );

		Reprint_Exporter::record_event( $start_event, array() );
		$this->serve_from( '81.229.206.253' );
		$this->assertCount( 4, $this->logged_entries(), 'A new migration logs its first served request again.' );
	}

	/**
	 * Data provider for test_served_requests_are_logged_once_per_ip_per_migration.
	 *
	 * @return array
	 */
	public static function provide_migration_start_events() {
		return array(
			'secret rotated'       => array( 'secret_rotated' ),
			'public key installed' => array( 'public_key_installed' ),
			'window opened'        => array( 'window_opened' ),
		);
	}

	/**
	 * Refused requests stay out of the log: a wrong credential is routine, not news for the owner.
	 */
	public function test_refused_requests_are_not_logged() {
		Activity_Log::init();

		Reprint_Exporter::record_event( 'export_refused', array( 'code' => 403 ) );

		$this->assertSame( array(), $this->logged_entries() );
	}
}
