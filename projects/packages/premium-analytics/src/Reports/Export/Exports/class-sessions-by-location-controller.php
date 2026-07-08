<?php
/**
 * REST API Reports Sessions by Location controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Sessions by Location CSV Export Controller.
 *
 * Handles CSV exports for the Sessions by Location report.
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by country_code).
 *
 * @since $$next-version$$
 */
class Sessions_By_Location_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'sessionsbylocation';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Sessions by Location', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/sessions/by-location';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'location' => __( 'Location', 'jetpack-premium-analytics' ),
			'visitors' => __( 'Visitors', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * Empty rows (empty label) are handled by the parent via get_empty_row_check_field()
	 * and get_empty_row_label(); do not skip them here.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$defaults = $this->get_default_values();
		$location = $this->get_location_label( $item );

		return array(
			'location' => $location ? $location : $defaults['label'],
			'visitors' => $item['visitors'] ?? $defaults['visitors'],
		);
	}

	/**
	 * Get the location label, translated when possible via WooCommerce countries.
	 *
	 * Uses the store's locale for country names when country_code is present;
	 * otherwise falls back to the API label.
	 *
	 * @param array $item Row data with optional 'country_code' and 'label'.
	 * @return string Location label for CSV.
	 */
	private function get_location_label( array $item ): string {
		$country_code = $item['country_code'] ?? '';
		$api_label    = $item['label'] ?? '';

		if ( $country_code && function_exists( 'WC' ) && WC()->countries ) {
			$countries = WC()->countries->get_countries();
			if ( isset( $countries[ $country_code ] ) ) {
				return $countries[ $country_code ];
			}
		}

		return $api_label;
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'label'        => '',
			'country_code' => '',
			'visitors'     => 0,
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Sets group_by to country and limit to 100.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'group_by' => 'country',
			'limit'    => 100,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'country_code',
			'label',
			'visitors',
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Sessions by Location is a ranked report, so comparison data should be matched by country_code.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'country_code';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * When a location exists in the original period but not in the comparison period,
	 * the label should still be shown for clarity.
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array( 'label' );
	}

	/**
	 * Get the field name to check for emptiness.
	 *
	 * Enables parent empty row handling: rows with empty label are either skipped
	 * or included with the customizable empty row label (e.g. "Unassigned").
	 *
	 * @return array The field names to check.
	 */
	public function get_empty_row_check_field() {
		return array( 'label' );
	}

	/**
	 * Apply the custom empty row label to the formatted row.
	 *
	 * Overridden because the API field is 'label' but the CSV column is 'location'.
	 *
	 * @param array $row          The formatted row data.
	 * @param array $check_fields The field names that were empty.
	 * @return array The row with custom label applied.
	 */
	protected function apply_empty_row_label( array $row, array $check_fields ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$custom_label = $this->get_empty_row_label();
		if ( isset( $row['location'] ) && '' === $row['location'] ) {
			$row['location'] = $custom_label;
		}
		return $row;
	}
}
