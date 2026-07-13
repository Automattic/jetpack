<?php
/**
 * Detailed tests for the concrete CSV export report controllers and the shared abstract helpers.
 *
 * Each report PR adds its controller's assertions here. This PR covers the reference
 * report (Orders Over Time).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller
 */
#[CoversClass( Orders_Over_Time_Controller::class )]
#[CoversClass( Abstract_Csv_Report_Controller::class )]
class Controllers_Test extends TestCase {

	private function orders(): Orders_Over_Time_Controller {
		return new Orders_Over_Time_Controller( new Report_Registry() );
	}

	public function test_orders_metadata() {
		$c = $this->orders();
		$this->assertSame( 'ordersovertime', $c->get_report_key() );
		$this->assertSame( 'Orders Over Time', $c->get_report_label() );
		$this->assertSame( 'reports/orders/by-date', $c->get_data_endpoint() );
		$this->assertSame( 1000, $c->get_batch_limit() );
		$this->assertSame( array( 'date_type' => 'created' ), $c->get_additional_params() );
	}

	public function test_orders_column_headers_use_interval_label() {
		$c = $this->orders();
		// Default interval label falls back to "Date".
		$this->assertSame( 'Date', $c->get_column_headers()['time_interval'] );
		// A known interval maps to its label.
		$this->assertSame( 'Month', $c->get_column_headers( 'month' )['time_interval'] );
		$this->assertSame( 'Hour', $c->get_column_headers( 'hour' )['time_interval'] );
	}

	public function test_orders_format_row() {
		$c = $this->orders();

		$row = $c->format_row_for_csv(
			array(
				'date_start' => '2026-03-15 00:00:00',
				'orders_no'  => 42,
			)
		);
		$this->assertSame( '2026-03-15', $row['time_interval'] );
		$this->assertSame( 42, $row['orders_no'] );

		// Missing orders_no falls back to the default; a bad date yields an empty interval.
		$row = $c->format_row_for_csv( array( 'date_start' => 'not-a-date' ) );
		$this->assertSame( '', $row['time_interval'] );
		$this->assertSame( 0, $row['orders_no'] );

		// Absent date_start also yields an empty interval.
		$this->assertSame( '', $c->format_row_for_csv( array() )['time_interval'] );
	}

	public function test_orders_comparison_fields() {
		$c = $this->orders();

		$row = $c->format_row_with_comparison(
			array(
				'date_start'            => '2026-03-15 00:00:00',
				'orders_no'             => 42,
				'comparison_date_start' => '2026-02-15 00:00:00',
				'comparison_orders_no'  => 30,
			)
		);
		$this->assertSame( 42, $row['orders_no'] );
		$this->assertSame( 30, $row['comparison_orders_no'] );
		$this->assertSame( '2026-02-15', $row['comparison_time_interval'] );

		// No comparison data => no comparison keys added.
		$plain = $c->format_row_with_comparison( array( 'orders_no' => 5 ) );
		$this->assertArrayNotHasKey( 'comparison_orders_no', $plain );
	}
}
