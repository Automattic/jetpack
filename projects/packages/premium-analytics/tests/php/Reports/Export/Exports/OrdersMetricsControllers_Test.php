<?php
/**
 * Tests for the orders/by-date time-series metric controllers (avg order value, avg items,
 * gross / net / total sales over time).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AvgItemsPerOrderOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AvgOrderValueOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\GrossSalesOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\NetSalesOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TotalSalesOverTimeController;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AvgOrderValueOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AvgItemsPerOrderOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\GrossSalesOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\NetSalesOverTimeController
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TotalSalesOverTimeController
 */
#[CoversClass( AvgOrderValueOverTimeController::class )]
#[CoversClass( AvgItemsPerOrderOverTimeController::class )]
#[CoversClass( GrossSalesOverTimeController::class )]
#[CoversClass( NetSalesOverTimeController::class )]
#[CoversClass( TotalSalesOverTimeController::class )]
class OrdersMetricsControllers_Test extends TestCase {

	/**
	 * @return array<string, array{0:string,1:string,2:string,3:bool}>
	 */
	public static function metric_provider(): array {
		return array(
			// class, report key, value field, money-formatted?
			'avg order value' => array( AvgOrderValueOverTimeController::class, 'avgordervalueovertime', 'average_order_value', true ),
			'avg items'       => array( AvgItemsPerOrderOverTimeController::class, 'avgitemsperorderovertime', 'avg_items', false ),
			'gross sales'     => array( GrossSalesOverTimeController::class, 'grosssalesovertime', 'orders_value_gross', true ),
			'net sales'       => array( NetSalesOverTimeController::class, 'netsalesovertime', 'orders_value_net', true ),
			'total sales'     => array( TotalSalesOverTimeController::class, 'totalsalesovertime', 'total_sales', true ),
		);
	}

	/**
	 * @dataProvider metric_provider
	 * @param string $class     Controller class.
	 * @param string $key       Expected report key.
	 * @param string $field     Value field name.
	 * @param bool   $is_money  Whether the value is money-formatted.
	 */
	#[DataProvider( 'metric_provider' )]
	public function test_metadata_and_columns( string $class, string $key, string $field, bool $is_money ) {
		$controller = new $class( ReportRegistry::instance() );

		$this->assertSame( $key, $controller->get_report_key() );
		// All variants read from the shared orders/by-date endpoint.
		$this->assertSame( 'reports/orders/by-date', $controller->get_data_endpoint() );

		$columns = $controller->get_column_headers( 'month' );
		$this->assertSame( array( 'time_interval', $field ), array_keys( $columns ) );
		// Time-interval header reflects the requested interval.
		$this->assertSame( 'Month', $columns['time_interval'] );
	}

	/**
	 * @dataProvider metric_provider
	 * @param string $class     Controller class.
	 * @param string $key       Expected report key.
	 * @param string $field     Value field name.
	 * @param bool   $is_money  Whether the value is money-formatted.
	 */
	#[DataProvider( 'metric_provider' )]
	public function test_format_row( string $class, string $key, string $field, bool $is_money ) {
		$controller = new $class( ReportRegistry::instance() );

		$row = $controller->format_row_for_csv(
			array(
				'date_start' => '2026-03-15 00:00:00',
				$field       => 1234.5,
			)
		);
		$this->assertSame( '2026-03-15', $row['time_interval'] );
		$this->assertSame( $is_money ? '1234.50' : 1234.5, $row[ $field ] );

		// Missing value falls back to the default (money formats 0 as "0.00").
		$missing = $controller->format_row_for_csv( array( 'date_start' => '2026-03-15 00:00:00' ) );
		$this->assertSame( $is_money ? '0.00' : 0, $missing[ $field ] );
	}

	public function test_comparison_fields_added_for_time_series() {
		$controller = new GrossSalesOverTimeController( ReportRegistry::instance() );

		$row = $controller->format_row_with_comparison(
			array(
				'date_start'                    => '2026-03-15 00:00:00',
				'orders_value_gross'            => 100,
				'comparison_date_start'         => '2026-02-15 00:00:00',
				'comparison_orders_value_gross' => 80,
			)
		);
		$this->assertSame( '100.00', $row['orders_value_gross'] );
		$this->assertSame( '80.00', $row['comparison_orders_value_gross'] );
	}
}
