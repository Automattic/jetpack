<?php
/**
 * REST API Reports Total Sales Over Time controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\AbstractCSVReportController;

/**
 * Total Sales Over Time CSV Export Controller.
 *
 * Time-series report over the orders/by-date endpoint; supports comparison mode.
 *
 * @since $$next-version$$
 */
class TotalSalesOverTimeController extends AbstractCSVReportController {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'totalsalesovertime';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Total Sales Over Time', 'jetpack-premium-analytics' );
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
			'time_interval' => $this->get_interval_label( $interval ),
			'total_sales'   => __( 'Total sales', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'total_sales' => 0,
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * @param array $item The row data.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item ): array {
		$defaults = $this->get_default_values();
		return array(
			'time_interval' => $this->format_time_interval( $item ),
			'total_sales'   => self::format_amount( $item['total_sales'] ?? $defaults['total_sales'] ),
		);
	}
}
