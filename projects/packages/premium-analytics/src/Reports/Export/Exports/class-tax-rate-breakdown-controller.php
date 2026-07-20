<?php
/**
 * REST API Reports Tax Rate Breakdown controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Data_Fetcher;

/**
 * Tax Rate Breakdown CSV Export Controller.
 *
 * Handles CSV exports for the Tax Rate Breakdown report, showing individual
 * tax rates with their totals over a period.
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by tax_rate_id).
 *
 * @since $$next-version$$
 */
class Tax_Rate_Breakdown_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Cache for tax rate percentages by tax_rate_id.
	 *
	 * @var array<int, float|null>
	 */
	private $tax_rates_cache = array();

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'taxratebreakdown';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Tax Rate Breakdown', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/taxes/breakdown';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'tax_code'     => __( 'Tax code', 'jetpack-premium-analytics' ),
			'rate'         => __( 'Rate', 'jetpack-premium-analytics' ),
			'total_tax'    => __( 'Total tax', 'jetpack-premium-analytics' ),
			'order_tax'    => __( 'Order tax', 'jetpack-premium-analytics' ),
			'shipping_tax' => __( 'Shipping tax', 'jetpack-premium-analytics' ),
			'orders'       => __( 'Orders', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * Empty rows (empty tax code/name) are handled by the parent via get_empty_row_check_field()
	 * and get_empty_row_label(); do not skip them here.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$defaults = $this->get_default_values();

		// Get tax_rate_id for lookups.
		$tax_rate_id = (int) ( $item['tax_rate_id'] ?? $defaults['tax_rate_id'] );

		// Get tax rate, falling back to WooCommerce lookup if missing from API response.
		// Use array_key_exists to distinguish between missing key and explicit 0 value.
		if ( array_key_exists( 'tax_rate', $item ) ) {
			$tax_rate = $item['tax_rate'];
		} elseif ( ! empty( $tax_rate_id ) ) {
			$tax_rate = $this->get_tax_rate_percent( $tax_rate_id );
		} else {
			$tax_rate = $defaults['tax_rate'];
		}

		return array(
			'tax_code'     => $item['tax_rate_code'] ?? $defaults['tax_rate_code'],
			'rate'         => $this->format_percentage( $tax_rate ),
			'total_tax'    => self::format_amount( $item['total_tax'] ?? $defaults['total_tax'] ),
			'order_tax'    => self::format_amount( $item['order_tax'] ?? $defaults['order_tax'] ),
			'shipping_tax' => self::format_amount( $item['shipping_tax'] ?? $defaults['shipping_tax'] ),
			'orders'       => $item['orders_count'] ?? $defaults['orders_count'],
		);
	}

	/**
	 * Get tax rate percentage from WooCommerce, with caching.
	 *
	 * Retrieves the tax rate percentage for a given tax_rate_id using WC_Tax::get_rate_percent_value().
	 * Results are cached in memory for the duration of the export to avoid repeated database queries.
	 * Returns null if WooCommerce is unavailable or the tax rate ID doesn't exist in the database.
	 *
	 * @param int $tax_rate_id The tax rate ID.
	 * @return float|null The tax rate percentage, or null if not found.
	 */
	private function get_tax_rate_percent( int $tax_rate_id ): ?float {
		if ( ! array_key_exists( $tax_rate_id, $this->tax_rates_cache ) ) {
			if ( ! class_exists( \WC_Tax::class ) ) {
				$this->tax_rates_cache[ $tax_rate_id ] = null;
				return $this->tax_rates_cache[ $tax_rate_id ];
			}

			$tax_rate_code = \WC_Tax::get_rate_code( $tax_rate_id );
			if ( empty( $tax_rate_code ) ) {
				$this->tax_rates_cache[ $tax_rate_id ] = null;
				return $this->tax_rates_cache[ $tax_rate_id ];
			}

			$this->tax_rates_cache[ $tax_rate_id ] = \WC_Tax::get_rate_percent_value( $tax_rate_id );
		}
		return $this->tax_rates_cache[ $tax_rate_id ];
	}

	/**
	 * Format a percentage value for CSV display.
	 *
	 * Formats as "10.00%" with two decimal places.
	 * Handles negative values by taking absolute value (tax rates should always be positive).
	 * Returns "N/A" when the value is null (rate unavailable from both API and WooCommerce).
	 *
	 * @param float|int|null $value The percentage value to format.
	 * @return string The formatted percentage or "N/A".
	 */
	private function format_percentage( $value ): string {
		if ( null === $value ) {
			return 'N/A';
		}
		return number_format( abs( (float) $value ), 2, '.', '' ) . '%';
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'tax_rate_id'   => 0,
			'tax_rate_code' => '',
			'tax_rate'      => null,
			'total_tax'     => 0,
			'order_tax'     => 0,
			'shipping_tax'  => 0,
			'orders_count'  => 0,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'tax_rate_id',
			'tax_rate_code',
			'total_tax',
			'order_tax',
			'shipping_tax',
			'orders_count',
		);
	}

	/**
	 * Format a row with comparison, ensuring the comparison tax code matches the original.
	 *
	 * For the same tax rate (same row), the tax code label is identical in both periods.
	 * After the parent adds comparison columns, we set comparison_tax_code to the same
	 * value as tax_code so the label column is consistent.
	 *
	 * @param array       $item     The raw data item (merged original + comparison).
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row with comparison fields.
	 */
	public function format_row_with_comparison( array $item, ?string $interval = null ): array {
		$row = parent::format_row_with_comparison( $item, $interval );

		$prefix = Report_Data_Fetcher::COMPARISON_INDEX_PREFIX;
		$key    = $prefix . 'tax_code';
		if ( isset( $row['tax_code'] ) && isset( $row[ $key ] ) ) {
			$row[ $key ] = $row['tax_code'];
		}

		return $row;
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Tax Rate Breakdown is a ranked report, so comparison data should be matched by tax_rate_id.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'tax_rate_id';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * When a tax rate exists in the original period but not in the comparison period,
	 * the tax code should still be shown for clarity. tax_rate_code is the field the
	 * taxes/breakdown endpoint actually returns (name/country/state/priority are not
	 * part of its schema).
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array( 'tax_rate_code' );
	}

	/**
	 * Get the field name to check for emptiness.
	 *
	 * Enables parent empty row handling: rows with an empty tax code are either skipped
	 * or included with the customizable empty row label (e.g. "Unassigned"). Uses
	 * tax_rate_code, the field the endpoint returns and the one displayed as the tax code.
	 *
	 * @return array The field names to check.
	 */
	public function get_empty_row_check_field() {
		return array( 'tax_rate_code' );
	}

	/**
	 * Apply the custom empty row label to the formatted row.
	 *
	 * Overridden because the API field is 'name' but the CSV column is 'tax_code'.
	 *
	 * @param array $row          The formatted row data.
	 * @param array $check_fields The field names that were empty.
	 * @return array The row with custom label applied.
	 */
	protected function apply_empty_row_label( array $row, array $check_fields ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$custom_label = $this->get_empty_row_label();
		if ( isset( $row['tax_code'] ) && '' === $row['tax_code'] ) {
			$row['tax_code'] = $custom_label;
		}
		return $row;
	}
}
