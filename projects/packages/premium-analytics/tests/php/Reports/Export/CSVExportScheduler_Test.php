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
		$prop->setAccessible( true );
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
}
