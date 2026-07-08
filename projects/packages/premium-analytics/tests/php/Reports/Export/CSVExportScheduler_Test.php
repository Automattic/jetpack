<?php
/**
 * Tests for the CSV export scheduler's schedule_export() branches.
 *
 * The pipeline methods process_export_job()/cleanup run against the live site (network +
 * Action Scheduler); these tests cover the scheduling validation and dispatch.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

require_once __DIR__ . '/fixtures/class-spy-logger.php';
require_once __DIR__ . '/fixtures/class-fake-email.php';
require_once __DIR__ . '/fixtures/class-fake-fetcher.php';
require_once __DIR__ . '/fixtures/class-fake-generator.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\CSVExportScheduler
 */
#[CoversClass( CSVExportScheduler::class )]
class CSVExportScheduler_Test extends TestCase {

	/**
	 * Scheduler under test.
	 *
	 * @var CSVExportScheduler
	 */
	private $scheduler;

	/**
	 * Build a scheduler with a fresh registry (Orders registered) and fake email.
	 *
	 * @before
	 */
	#[Before]
	public function set_up_scheduler() {
		$prop = new ReflectionProperty( ReportRegistry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		$prop->setValue( null, null );

		$registry = ReportRegistry::instance();
		$registry->register_controller( new OrdersOverTimeController( $registry ) );

		$logger          = new Spy_Logger();
		$this->scheduler = new CSVExportScheduler(
			$registry,
			new ReportDataFetcher( $logger ),
			new ReportCSVGenerator( $logger ),
			new Fake_Email(),
			$logger
		);
	}

	public function test_schedule_export_rejects_invalid_email() {
		$result = $this->scheduler->schedule_export( 'ordersovertime', array(), 1, 'not-an-email' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_email', $result->get_error_code() );
	}

	public function test_schedule_export_rejects_unknown_report_type() {
		$result = $this->scheduler->schedule_export( 'nope', array(), 1, 'admin@example.com' );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_report_type', $result->get_error_code() );
	}

	public function test_schedule_export_returns_action_id_on_success() {
		$result = $this->scheduler->schedule_export( 'ordersovertime', array( 'from' => 'x' ), 1, 'admin@example.com' );
		$this->assertSame( 555, $result );
	}

	/**
	 * Build a scheduler wired with a canned fetcher (no network) and a recording fake email.
	 *
	 * @param mixed      $fetch_result The value the fake fetcher returns (array or WP_Error).
	 * @param Fake_Email $email        The recording email double.
	 * @return CSVExportScheduler
	 */
	private function scheduler_with_fake_fetcher( $fetch_result, Fake_Email $email ): CSVExportScheduler {
		$registry        = ReportRegistry::instance(); // Orders Over Time registered in set_up_scheduler().
		$logger          = new Spy_Logger();
		$fetcher         = new Fake_Fetcher( $logger );
		$fetcher->result = $fetch_result;
		return new CSVExportScheduler( $registry, $fetcher, new Fake_Generator( $logger ), $email, $logger );
	}

	public function test_process_export_job_emails_attachment_and_restores_user() {
		$email     = new Fake_Email();
		$scheduler = $this->scheduler_with_fake_fetcher( array( 'data' => array( array( 'orders_no' => 5 ) ) ), $email );

		wp_set_current_user( 0 );
		$scheduler->process_export_job(
			'ordersovertime',
			array(
				'from'     => '2026-01-01T00:00:00',
				'to'       => '2026-02-01T00:00:00',
				'interval' => 'month',
			),
			1,
			'admin@example.com'
		);

		$this->assertCount( 1, $email->sends );
		$this->assertSame( 'admin@example.com', $email->sends[0]['recipient'] );
		$this->assertSame( 'Orders Over Time', $email->sends[0]['report_label'] );
		// The requester's user context must be restored (here: back to the anonymous user).
		$this->assertSame( 0, get_current_user_id() );
	}

	public function test_process_export_job_rethrows_on_fetch_error() {
		$email     = new Fake_Email();
		$scheduler = $this->scheduler_with_fake_fetcher( new \WP_Error( 'boom', 'fetch failed' ), $email );

		$threw = false;
		try {
			$scheduler->process_export_job(
				'ordersovertime',
				array(
					'from' => 'x',
					'to'   => 'y',
				),
				1,
				'admin@example.com'
			);
		} catch ( \Exception $e ) {
			$threw = true;
		}

		$this->assertTrue( $threw, 'process_export_job must rethrow so Action Scheduler marks the job failed' );
		$this->assertCount( 0, $email->sends, 'no export email is sent when the fetch fails' );
	}
}
