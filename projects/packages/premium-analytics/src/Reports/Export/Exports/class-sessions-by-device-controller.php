<?php
/**
 * REST API Reports Sessions by Device controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Sessions by Device CSV Export Controller.
 *
 * Handles CSV exports for the Sessions by Device report.
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by device_type).
 *
 * @since $$next-version$$
 */
class Sessions_By_Device_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'sessionsbydevice';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Sessions by Device', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/sessions/by-device';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'device_type'     => __( 'Device type', 'jetpack-premium-analytics' ),
			'active_sessions' => __( 'Sessions', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$defaults = $this->get_default_values();

		return array(
			'device_type'     => $item['device_type'] ?? $defaults['device_type'],
			'active_sessions' => $item['active_sessions'] ?? $defaults['active_sessions'],
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'device_type'     => '',
			'active_sessions' => 0,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'device_type',
			'active_sessions',
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Sessions by Device is a ranked report, so comparison data should be matched by device_type.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'device_type';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * When a device exists in the original period but not in the comparison period,
	 * the device_type should still be shown for clarity.
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array( 'device_type' );
	}

	/**
	 * Get the field name to check for emptiness.
	 *
	 * @return array The field names to check.
	 */
	public function get_empty_row_check_field() {
		return array( 'device_type' );
	}
}
