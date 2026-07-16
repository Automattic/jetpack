<?php
/**
 * REST API Reports Coupon Use Over Time controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

defined( 'ABSPATH' ) || exit;

/**
 * Coupon Use Over Time CSV Export Controller.
 *
 * Handles CSV exports for the Coupon Use Over Time report, supporting both
 * single interval and comparison interval data.
 *
 * @since $$next-version$$
 */
class Coupon_Use_Over_Time_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'couponuseovertime';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Coupon Use Over Time', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/coupons/by-date';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array {
		return array(
			'time_interval'              => $this->get_interval_label( $interval ),
			'orders_no'                  => __( 'Total Orders', 'jetpack-premium-analytics' ),
			'orders_with_coupon'         => __( 'Orders with coupon', 'jetpack-premium-analytics' ),
			'total_sales'                => __( 'Total sales', 'jetpack-premium-analytics' ),
			'gross_sales_with_coupon'    => __( 'Gross sales with coupon', 'jetpack-premium-analytics' ),
			'gross_sales_without_coupon' => __( 'Gross sales without coupon', 'jetpack-premium-analytics' ),
			'coupons'                    => __( 'Discount amount - Total', 'jetpack-premium-analytics' ),
			'orders_value_net'           => __( 'Net sales - after discounts', 'jetpack-premium-analytics' ),
			'coupon_use_pct_of_sales'    => __( 'Coupon use as % of sales', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'total_orders'             => 0,
			'orders_with_coupon'       => 0,
			'total_sales'              => 0,
			'sales_with_coupon'        => 0,
			'sales_without_coupon'     => 0,
			'total_discount_amount'    => 0,
			'net_sales_after_discount' => 0,
			'coupon_usage_percentage'  => 0,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		// time_interval, date_start, and date_end are always returned by the
		// API for time-series endpoints and do not need to be requested.
		return array(
			'total_orders',
			'orders_with_coupon',
			'total_sales',
			'sales_with_coupon',
			'sales_without_coupon',
			'total_discount_amount',
			'net_sales_after_discount',
			'coupon_usage_percentage',
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array {
		$defaults = $this->get_default_values();

		return array(
			'time_interval'              => $this->format_time_interval( $item, $interval ),
			'orders_no'                  => (int) ( $item['total_orders'] ?? $defaults['total_orders'] ),
			'orders_with_coupon'         => (int) ( $item['orders_with_coupon'] ?? $defaults['orders_with_coupon'] ),
			'total_sales'                => self::format_amount( $item['total_sales'] ?? $defaults['total_sales'] ),
			'gross_sales_with_coupon'    => self::format_amount( $item['sales_with_coupon'] ?? $defaults['sales_with_coupon'] ),
			'gross_sales_without_coupon' => self::format_amount( $item['sales_without_coupon'] ?? $defaults['sales_without_coupon'] ),
			'coupons'                    => self::format_amount( $item['total_discount_amount'] ?? $defaults['total_discount_amount'] ),
			'orders_value_net'           => self::format_amount( $item['net_sales_after_discount'] ?? $defaults['net_sales_after_discount'] ),
			'coupon_use_pct_of_sales'    => number_format( (float) ( $item['coupon_usage_percentage'] ?? $defaults['coupon_usage_percentage'] ), 2, '.', '' ) . '%',
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'date_type' => self::DEFAULT_DATE_TYPE,
		);
	}
}
