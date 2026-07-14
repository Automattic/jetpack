<?php
/**
 * Tests for the concrete CSV export report controllers and the shared abstract helpers.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Conversion_Rate_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Revenue_By_Customer_Type_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Campaign_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Tax_Rate_Breakdown_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Performing_Products_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Visitors_Over_Time_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Conversion_Rate_Over_Time_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Visitors_Over_Time_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Performing_Products_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Revenue_By_Customer_Type_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Campaign_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Tax_Rate_Breakdown_Controller
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller
 */
#[CoversClass( Orders_Over_Time_Controller::class )]
#[CoversClass( Conversion_Rate_Over_Time_Controller::class )]
#[CoversClass( Visitors_Over_Time_Controller::class )]
#[CoversClass( Top_Performing_Products_Controller::class )]
#[CoversClass( Revenue_By_Customer_Type_Controller::class )]
#[CoversClass( Sales_By_Campaign_Controller::class )]
#[CoversClass( Tax_Rate_Breakdown_Controller::class )]
#[CoversClass( Abstract_Csv_Report_Controller::class )]
class Controllers_Test extends TestCase {

	private function orders(): Orders_Over_Time_Controller {
		return new Orders_Over_Time_Controller( new Report_Registry() );
	}

	private function visitors(): Visitors_Over_Time_Controller {
		return new Visitors_Over_Time_Controller( new Report_Registry() );
	}

	private function conversion_rate(): Conversion_Rate_Over_Time_Controller {
		return new Conversion_Rate_Over_Time_Controller( new Report_Registry() );
	}

	private function products(): Top_Performing_Products_Controller {
		return new Top_Performing_Products_Controller( new Report_Registry() );
	}

	private function revenue_by_customer_type(): Revenue_By_Customer_Type_Controller {
		return new Revenue_By_Customer_Type_Controller( new Report_Registry() );
	}

	private function sales_by_campaign(): Sales_By_Campaign_Controller {
		return new Sales_By_Campaign_Controller( new Report_Registry() );
	}

	private function tax_rate_breakdown(): Tax_Rate_Breakdown_Controller {
		return new Tax_Rate_Breakdown_Controller( new Report_Registry() );
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

	public function test_visitors_metadata_and_format() {
		$c = $this->visitors();
		$this->assertSame( 'visitorsovertime', $c->get_report_key() );
		$this->assertSame( 'reports/sessions/by-date', $c->get_data_endpoint() );
		$this->assertSame( array( 'time_interval', 'visitors' ), array_keys( $c->get_column_headers() ) );

		$row = $c->format_row_for_csv( array( 'date_start' => '2026-01-02 00:00:00' ) );
		$this->assertSame( '2026-01-02', $row['time_interval'] );
		$this->assertSame( 0, $row['visitors'] );
	}

	public function test_conversion_rate_formats_counts_and_percent() {
		$c = $this->conversion_rate();

		$row = $c->format_row_for_csv(
			array(
				'date_start'         => '2026-01-02 00:00:00',
				'active_sessions'    => 3,
				'with_cart_addition' => 2,
				'reached_checkout'   => 2,
				'completed_checkout' => 2,
			)
		);

		$this->assertSame( '2026-01-02', $row['time_interval'] );
		$this->assertSame( 3, $row['sessions'] );
		$this->assertSame( 2, $row['cart'] );
		$this->assertSame( 2, $row['checkout'] );
		$this->assertSame( 2, $row['purchase'] );
		$this->assertSame( '66.67%', $row['store_conversion_rate'] );

		$row = $c->format_row_for_csv( array( 'active_sessions' => 0 ) );
		$this->assertSame( '0.00%', $row['store_conversion_rate'] );
	}

	public function test_products_metadata() {
		$c = $this->products();
		$this->assertSame( 'topperformingproducts', $c->get_report_key() );
		$this->assertSame( 'reports/products', $c->get_data_endpoint() );
		$this->assertSame(
			array(
				'date_type' => 'created',
				'orderby'   => 'product_gross_revenue',
				'order'     => 'desc',
				'limit'     => 100,
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

		$zero_revenue_with_cogs = $c->format_row_for_csv(
			array(
				'net_revenue_with_cogs' => 0,
				'cogs_amount'           => 40,
			)
		);
		$this->assertSame( '-40.00', $zero_revenue_with_cogs['profit'] );
		$this->assertSame( 'N/A', $zero_revenue_with_cogs['margin'] );
	}

	public function test_revenue_by_customer_type_matches_endpoint_schema() {
		$c = $this->revenue_by_customer_type();
		$this->assertSame( 'revenuebycustomertype', $c->get_report_key() );
		$this->assertSame( 'reports/customers/new-returning', $c->get_data_endpoint() );
		$this->assertSame( array( 'customer_type', 'net_sales', 'orders_count' ), array_keys( $c->get_column_headers() ) );
		$this->assertSame( array( 'customer_type', 'net_sales', 'orders_count' ), $c->get_fields() );

		$row = $c->format_row_for_csv(
			array(
				'customer_type' => 'new',
				'net_sales'     => 123.45,
				'orders_count'  => 7,
			)
		);
		$this->assertSame( 'New Customer', $row['customer_type'] );
		$this->assertSame( '123.45', $row['net_sales'] );
		$this->assertSame( 7, $row['orders_count'] );

		$row = $c->format_row_for_csv( array( 'customer_type' => '' ) );
		$this->assertSame( 'Unassigned', $row['customer_type'] );
	}

	public function test_sales_by_campaign_empty_row_check_matches_dimension_field() {
		$c = $this->sales_by_campaign();
		$this->assertSame( array( 'campaign' ), $c->get_empty_row_check_field() );
	}

	public function test_tax_rate_breakdown_formats_comparison_tax_code_and_rates() {
		$c = $this->tax_rate_breakdown();

		$row = $c->format_row_with_comparison(
			array(
				'tax_rate_id'              => 10,
				'tax_rate_code'            => 'CA-STATE',
				'tax_rate'                 => 7.25,
				'total_tax'                => 12.34,
				'order_tax'                => 10,
				'shipping_tax'             => 2.34,
				'orders_count'             => 3,
				'comparison_tax_rate_id'   => 10,
				'comparison_tax_rate_code' => 'OLD-CODE',
				'comparison_tax_rate'      => 7.5,
				'comparison_total_tax'     => 8,
				'comparison_order_tax'     => 6,
				'comparison_shipping_tax'  => 2,
				'comparison_orders_count'  => 2,
			)
		);

		$this->assertSame( 'CA-STATE', $row['tax_code'] );
		$this->assertSame( '7.25%', $row['rate'] );
		$this->assertSame( 'CA-STATE', $row['comparison_tax_code'] );
		$this->assertSame( '7.50%', $row['comparison_rate'] );
		$this->assertSame( '8.00', $row['comparison_total_tax'] );

		$row = $c->format_row_for_csv( array( 'tax_rate_code' => 'UNKNOWN' ) );
		$this->assertSame( 'N/A', $row['rate'] );

		$row = $c->format_row_for_csv( array( 'tax_rate_id' => 999 ) );
		$this->assertSame( 'N/A', $row['rate'] );
	}
}
