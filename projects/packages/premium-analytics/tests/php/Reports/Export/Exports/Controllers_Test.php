<?php
/**
 * Tests for the concrete CSV export report controllers and the shared abstract helpers.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\AbstractCSVReportController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\ReportRegistry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\VisitorsOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TopPerformingProductsController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\AbstractCSVReportController
 */
#[CoversClass( OrdersOverTimeController::class )]
#[CoversClass( VisitorsOverTimeController::class )]
#[CoversClass( TopPerformingProductsController::class )]
#[CoversClass( AbstractCSVReportController::class )]
class Controllers_Test extends TestCase {

	private function orders(): OrdersOverTimeController {
		return new OrdersOverTimeController( ReportRegistry::instance() );
	}

	private function visitors(): VisitorsOverTimeController {
		return new VisitorsOverTimeController( ReportRegistry::instance() );
	}

	private function products(): TopPerformingProductsController {
		return new TopPerformingProductsController( ReportRegistry::instance() );
	}

	public function test_orders_metadata() {
		$c = $this->orders();
		$this->assertSame( 'ordersovertime', $c->get_report_key() );
		$this->assertSame( 'Orders Over Time', $c->get_report_label() );
		$this->assertSame( 'reports/orders/by-date', $c->get_data_endpoint() );
		$this->assertSame( 1000, $c->get_batch_limit() );
		$this->assertSame( array(), $c->get_additional_params() );
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

	public function test_visitors_metadata_and_format() {
		$c = $this->visitors();
		$this->assertSame( 'visitorsovertime', $c->get_report_key() );
		$this->assertSame( 'reports/sessions/by-date', $c->get_data_endpoint() );
		$this->assertSame( array( 'time_interval', 'visitors' ), array_keys( $c->get_column_headers() ) );

		$row = $c->format_row_for_csv( array( 'date_start' => '2026-01-02 00:00:00' ) );
		$this->assertSame( '2026-01-02', $row['time_interval'] );
		$this->assertSame( 0, $row['visitors'] );
	}

	public function test_products_metadata() {
		$c = $this->products();
		$this->assertSame( 'topperformingproducts', $c->get_report_key() );
		$this->assertSame( 'reports/products', $c->get_data_endpoint() );
		$this->assertSame(
			array(
				'orderby' => 'product_gross_revenue',
				'order'   => 'desc',
				'limit'   => 100,
			),
			$c->get_additional_params()
		);
	}

	public function test_products_row_uses_name_or_id_fallback_and_formats_amounts() {
		$c = $this->products();

		$named = $c->format_row_for_csv(
			array(
				'product_name'          => 'Widget',
				'product_gross_revenue' => 1234.5,
				'discount'              => 0,
			)
		);
		$this->assertSame( 'Widget', $named['product'] );
		$this->assertSame( '1234.50', $named['gross_sales'] );
		$this->assertSame( '0.00', $named['discounts'] );

		// No name => "Product #<id>" fallback.
		$this->assertSame( 'Product #7', $c->format_row_for_csv( array( 'product_id' => 7 ) )['product'] );
	}

	public function test_products_profit_and_margin() {
		$c = $this->products();

		$with_cogs = $c->format_row_for_csv(
			array(
				'net_revenue_with_cogs' => 100,
				'cogs_amount'           => 40,
			)
		);
		$this->assertSame( '60.00', $with_cogs['profit'] );
		$this->assertSame( '60.00', $with_cogs['margin'] );

		// No COGS => placeholder.
		$without = $c->format_row_for_csv( array() );
		$this->assertSame( 'N/A', $without['profit'] );
		$this->assertSame( 'N/A', $without['margin'] );
	}
}
