<?php
/**
 * REST API Reports Average Order Value controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Average Order Value CSV Export Controller.
 *
 * Handles CSV exports for the Average Order Value report, supporting both
 * single interval and comparison interval data.
 *
 * @since $$next-version$$
 */
class Average_Order_Value_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'averageordervalue';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Average Order Value', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/orders/by-date';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array {
		return array(
			'time_interval'       => $this->get_interval_label( $interval ),
			'orders_no'           => __( 'Orders', 'jetpack-premium-analytics' ),
			'total_sales'         => __( 'Gross sales', 'jetpack-premium-analytics' ),
			'average_order_value' => __( 'Average order value', 'jetpack-premium-analytics' ),
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
			'time_interval'       => $this->format_time_interval( $item, $interval ),
			'orders_no'           => $item['orders_no'] ?? $defaults['orders_no'],
			'total_sales'         => self::format_amount( $item['total_sales'] ?? $defaults['total_sales'] ),
			'average_order_value' => self::format_amount( $item['average_order_value'] ?? $defaults['average_order_value'] ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'orders_no'           => 0,
			'total_sales'         => 0,
			'average_order_value' => 0,
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
			'orders_no',
			'total_sales',
			'average_order_value',
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
