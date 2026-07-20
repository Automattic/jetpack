<?php
/**
 * REST API Reports Refunds Over Time controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Refunds Over Time CSV Export Controller.
 *
 * Handles CSV exports for the Refunds Over Time report, supporting both
 * single interval and comparison interval data.
 *
 * @since $$next-version$$
 */
class Refunds_Over_Time_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'refundsovertime';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Refunds Over Time', 'jetpack-premium-analytics' );
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
			'total_refunds'       => __( 'Total refunds', 'jetpack-premium-analytics' ),
			'orders_with_refunds' => __( 'Orders with refunds', 'jetpack-premium-analytics' ),
			'items_refunded'      => __( 'Items refunded', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'refunds'                  => 0,
			'total_orders_with_refund' => 0,
			'total_items_refunded'     => 0,
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
			'total_refunds'       => self::format_amount( $item['refunds'] ?? $defaults['refunds'] ),
			'orders_with_refunds' => $item['total_orders_with_refund'] ?? $defaults['total_orders_with_refund'],
			'items_refunded'      => $item['total_items_refunded'] ?? $defaults['total_items_refunded'],
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
			'refunds',
			'total_orders_with_refund',
			'total_items_refunded',
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
