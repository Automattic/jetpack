<?php
/**
 * Tests for the WP-Cron export scheduler.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Posts_Export_Controller;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/fixtures/class-spy-logger.php';
require_once __DIR__ . '/fixtures/class-fake-fetcher.php';
require_once __DIR__ . '/fixtures/class-fake-generator.php';
require_once __DIR__ . '/fixtures/class-fake-wp-mail-email.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Wp_Cron_Export_Scheduler
 */
#[CoversClass( Wp_Cron_Export_Scheduler::class )]
class WPCronExportScheduler_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		wp_clear_scheduled_hook( Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK );
		wp_clear_scheduled_hook( Wp_Cron_Export_Scheduler::CLEANUP_HOOK );
		wp_set_current_user( 0 );
	}

	private function scheduler( $fetch_result = null, ?Fake_Wp_Mail_Email $email = null, ?Spy_Logger $logger = null ): Wp_Cron_Export_Scheduler {
		$registry = new Report_Registry();
		$registry->register_controller( new Top_Posts_Export_Controller( $registry ) );

		$logger          = $logger ?? new Spy_Logger();
		$fetcher         = new Fake_Fetcher( $logger );
		$fetcher->result = null === $fetch_result ? array(
			'data' => array(
				array(
					'title' => 'Hello',
					'views' => 3,
				),
			),
		) : $fetch_result;

		return new Wp_Cron_Export_Scheduler(
			$registry,
			$fetcher,
			new Fake_Generator( $logger ),
			$email ?? new Fake_Wp_Mail_Email( $logger ),
			$logger
		);
	}

	public function test_schedule_export_rejects_invalid_email() {
		$result = $this->scheduler()->schedule_export( 'stats-top-posts', array(), 1, 'not-an-email' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_email', $result->get_error_code() );
	}

	public function test_schedule_export_rejects_unknown_report_type() {
		$result = $this->scheduler()->schedule_export( 'nope', array(), 1, 'admin@example.com' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_report_type', $result->get_error_code() );
	}

	public function test_schedule_export_schedules_single_wp_cron_event() {
		$result = $this->scheduler()->schedule_export(
			'stats-top-posts',
			array( 'from' => '2026-01-01T00:00:00' ),
			1,
			'admin@example.com'
		);

		$this->assertTrue( $result );
		$this->assertIsInt(
			wp_next_scheduled(
				Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK,
				array(
					'stats-top-posts',
					array( 'from' => '2026-01-01T00:00:00' ),
					1,
					'admin@example.com',
				)
			)
		);
	}

	public function test_schedule_export_treats_duplicate_wp_cron_event_as_success() {
		$args = array( 'from' => '2026-01-01T00:00:00' );

		$this->assertTrue( $this->scheduler()->schedule_export( 'stats-top-posts', $args, 1, 'admin@example.com' ) );
		$this->assertTrue( $this->scheduler()->schedule_export( 'stats-top-posts', $args, 1, 'admin@example.com' ) );

		$this->assertIsInt(
			wp_next_scheduled(
				Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK,
				array(
					'stats-top-posts',
					$args,
					1,
					'admin@example.com',
				)
			)
		);
	}

	public function test_schedule_export_preserves_wp_cron_error_details() {
		$block_schedule = static function ( $pre, $event ) {
			if ( Wp_Cron_Export_Scheduler::EXPORT_ACTION_HOOK === $event->hook ) {
				return new \WP_Error( 'cron_blocked', 'Cron scheduling is blocked.' );
			}

			return $pre;
		};

		add_filter( 'pre_schedule_event', $block_schedule, 10, 2 );
		try {
			$result = $this->scheduler()->schedule_export(
				'stats-top-posts',
				array( 'from' => '2026-01-01T00:00:00' ),
				1,
				'admin@example.com'
			);
		} finally {
			remove_filter( 'pre_schedule_event', $block_schedule, 10 );
		}

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'cron_blocked', $result->get_error_code() );
		$this->assertSame( 'Cron scheduling is blocked.', $result->get_error_message() );
		$this->assertSame( array( 'status' => 500 ), $result->get_error_data() );
	}

	public function test_process_export_job_emails_attachment_and_restores_user() {
		$email     = new Fake_Wp_Mail_Email();
		$scheduler = $this->scheduler( null, $email );

		wp_set_current_user( 0 );
		$scheduler->process_export_job(
			'stats-top-posts',
			array(
				'from'     => '2026-01-01T00:00:00',
				'to'       => '2026-01-03T00:00:00',
				'interval' => 'day',
			),
			1,
			'admin@example.com'
		);

		$this->assertCount( 1, $email->sends );
		$this->assertSame( 'admin@example.com', $email->sends[0]['recipient'] );
		$this->assertSame( 'Top Posts & Pages', $email->sends[0]['report_label'] );
		$this->assertSame( 0, get_current_user_id() );
	}

	public function test_process_export_job_logs_failure_sends_error_email_and_does_not_throw() {
		$logger    = new Spy_Logger();
		$email     = new Fake_Wp_Mail_Email();
		$scheduler = $this->scheduler( new \WP_Error( 'boom', 'fetch failed' ), $email, $logger );

		$error_mail = array();
		$capture    = static function ( $return, $atts ) use ( &$error_mail ) {
			$error_mail = $atts;
			return true;
		};

		wp_set_current_user( 0 );
		add_filter( 'pre_wp_mail', $capture, 10, 2 );
		try {
			$scheduler->process_export_job(
				'stats-top-posts',
				array(
					'from' => '2026-01-01T00:00:00',
					'to'   => '2026-01-03T00:00:00',
				),
				1,
				'admin@example.com'
			);
		} finally {
			remove_filter( 'pre_wp_mail', $capture );
		}

		$this->assertCount( 0, $email->sends );
		$this->assertSame( 'exception', $logger->entries[1]['level'] );
		$this->assertSame( 'fetch failed', $logger->entries[1]['message'] );
		$this->assertSame( 'admin@example.com', $error_mail['to'] );
		$this->assertSame( 0, get_current_user_id() );
	}
}
