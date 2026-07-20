<?php
/**
 * Abstract CSV Report Controller
 *
 * Base class for CSV export report controllers. Provides common functionality
 * for formatting and exporting report data to CSV via the new Report_Registry system.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use DateTime;
use Exception;

/**
 * Abstract base class for CSV report controllers.
 *
 * All report controllers extend this base, which centralizes comparison-period
 * handling, empty-row logic, requested-field selection, and value formatting.
 *
 * Each concrete controller should implement:
 * - get_report_key(): Unique identifier for the report
 * - get_report_label(): Human-readable name
 * - get_data_endpoint(): API endpoint to fetch data from
 * - get_column_headers(): CSV column headers
 * - format_row_for_csv(): Transform raw data row to CSV format
 *
 * Optional overrides:
 * - get_batch_limit(): Maximum number of items per batch (defaults to DEFAULT_BATCH_LIMIT)
 * - get_additional_params(): Additional parameters to include in data requests (e.g., filters)
 *
 * The parent class handles:
 * - Auto-registration with Report_Registry in constructor
 * - Automatic comparison field handling via format_row_with_comparison()
 * - Helper methods for common formatting tasks
 *
 * @since $$next-version$$
 */
abstract class Abstract_Csv_Report_Controller implements Csv_Report_Controller_Interface {

	/**
	 * Default batch limit for time-based reports (1000 items).
	 */
	protected const DEFAULT_BATCH_LIMIT = 1000;

	/**
	 * Default date type for order-based reports (creation date).
	 */
	protected const DEFAULT_DATE_TYPE = 'created';

	/**
	 * Report registry instance.
	 *
	 * @var Report_Registry
	 */
	protected $registry;

	/**
	 * Cached result of should_include_empty_rows() to avoid repeated filter calls.
	 *
	 * @var bool|null Null if not yet determined, otherwise the cached boolean result.
	 */
	private $cached_include_empty_rows = null;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry $registry Registry instance (injected by DI).
	 */
	public function __construct( Report_Registry $registry ) {
		$this->registry = $registry;
	}

	/**
	 * Register this controller with the report registry.
	 *
	 * @return void
	 */
	public function register(): void {
		$this->registry->register_controller( $this );
	}

	/**
	 * Format a row with automatic comparison field handling.
	 *
	 * This method wraps format_row_for_csv() and automatically adds
	 * comparison fields if present in the data.
	 *
	 * @param array       $item     The raw data item.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row with comparison fields.
	 */
	public function format_row_with_comparison( array $item, ?string $interval = null ): array {
		$prefix = Report_Data_Fetcher::COMPARISON_INDEX_PREFIX;

		// Extract original data (fields without comparison_ prefix) to check for empty values.
		// Note: We format the full $item, not the extracted subset, to preserve all data.
		$original_data = $this->extract_data_by_prefix( $item, $prefix, false );
		$row           = $this->format_row_with_empty_handling( $original_data, $item, $interval );

		return $this->add_comparison_fields( $row, $item, $interval );
	}

	// ============================================================================
	// Abstract Methods - Must be implemented by child classes
	// ============================================================================

	/**
	 * Get the report key (unique identifier).
	 *
	 * @return string
	 */
	abstract public function get_report_key(): string;

	/**
	 * Get the report label (human-readable name).
	 *
	 * @return string
	 */
	abstract public function get_report_label(): string;

	/**
	 * Get the data endpoint (API route).
	 *
	 * @return string
	 */
	abstract public function get_data_endpoint(): string;

	/**
	 * Get the column headers for CSV export.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array
	 */
	abstract public function get_column_headers( ?string $interval = null ): array;

	/**
	 * Format a single data item for CSV export.
	 *
	 * This method should return the base row data without comparison fields.
	 * Comparison fields are automatically added by format_row_with_comparison().
	 *
	 * @param array       $item     The raw data item.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row for CSV.
	 */
	abstract public function format_row_for_csv( array $item, ?string $interval = null ): array;

	/**
	 * Get default values for missing data fields.
	 *
	 * This method should return an array of default values for all possible fields
	 * in this report. Used when creating empty items for missing comparison data.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	abstract public function get_default_values(): array;

	/**
	 * Get the batch limit (max items per request).
	 *
	 * Override this method in child classes if a different batch limit is needed.
	 *
	 * @return int
	 */
	public function get_batch_limit(): int {
		return self::DEFAULT_BATCH_LIMIT;
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Override this method in child classes to add controller-specific parameters
	 * (e.g., filters) that should be included in every data fetch request.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array();
	}

	/**
	 * Get the list of fields to request from the API.
	 *
	 * Override in subclasses to request only the fields needed for
	 * this report, reducing API response payload size.
	 * Return an empty array to request all fields (default behavior).
	 *
	 * @return array Field names to request, or empty array for all fields.
	 */
	public function get_fields(): array {
		return array();
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Default: null (index-based matching for time-series reports).
	 * Override in child classes for ID-based matching (ranked reports).
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return null;
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * Default: empty array (no fields preserved for time-series reports).
	 * Override in ranked report controllers to specify identifying fields like
	 * 'product_name' or 'coupon_code' that should be copied when comparison data is missing.
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array();
	}

	/**
	 * Whether to use array format for filter values in IN filters.
	 *
	 * Default: false (comma-separated format for URL efficiency).
	 * Override in controllers that require array format (e.g., order-attribution).
	 *
	 * @return bool True to use array format, false for comma-separated (default).
	 */
	public function use_array_filter_format(): bool {
		return false;
	}

	/**
	 * Whether to include empty rows by default.
	 *
	 * Default: true (include rows with empty identifying fields).
	 * Override in child controllers to return false if empty rows should be excluded by default.
	 *
	 * @return bool True to include empty rows, false to exclude them.
	 */
	protected function should_include_empty_rows_by_default(): bool {
		return true;
	}

	/**
	 * Whether to include rows with empty identifying fields in the export.
	 *
	 * Calls should_include_empty_rows_by_default() and applies a filter for global control.
	 * Filterable via 'jetpack_premium_analytics_csv_include_empty_rows' to globally
	 * control empty row inclusion across all reports or specific reports.
	 *
	 * The result is cached per controller instance to avoid repeated filter calls
	 * when processing large datasets.
	 *
	 * @return bool True to include empty rows with custom label, false to skip them.
	 */
	public function should_include_empty_rows(): bool {
		// Return cached value if already determined.
		if ( null !== $this->cached_include_empty_rows ) {
			return $this->cached_include_empty_rows;
		}

		$default = $this->should_include_empty_rows_by_default();

		/**
		 * Filter whether to include empty rows in CSV exports.
		 *
		 * This filter takes precedence over controller defaults, allowing global control.
		 *
		 * @param bool   $include_empty Whether to include empty rows (controller default).
		 * @param string $report_key    The report key for this controller.
		 * @param object $controller    The controller instance.
		 */
		$this->cached_include_empty_rows = apply_filters( 'jetpack_premium_analytics_csv_include_empty_rows', $default, $this->get_report_key(), $this );

		return $this->cached_include_empty_rows;
	}

	/**
	 * Get the label to use for rows with empty identifying fields.
	 *
	 * Only used when should_include_empty_rows() returns true.
	 * Override in child controllers to customize the label for empty rows.
	 *
	 * @return string The label to use for empty rows.
	 */
	public function get_empty_row_label(): string {
		return __( 'Unassigned', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the field name(s) to check for emptiness when determining if a row should be skipped.
	 *
	 * Default: null (no empty row checking).
	 * Override in ranked report controllers to specify the identifying field(s) to check.
	 * Returns an array of field names (all must be empty to skip the row).
	 *
	 * @return array|null Array of field name(s) to check, or null to skip empty checking.
	 */
	public function get_empty_row_check_field() {
		return null;
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Format a time interval for display in CSV.
	 *
	 * If 'hour', formats as 'Y-m-d H:00', otherwise 'Y-m-d'.
	 *
	 * @param array       $item     The data item containing date_start.
	 * @param string|null $interval Optional time interval. If 'hour', formats as 'Y-m-d H:00', otherwise 'Y-m-d'.
	 * @return string The formatted date string.
	 */
	protected function format_time_interval( array $item, ?string $interval = null ): string {
		if ( ! isset( $item['date_start'] ) || empty( $item['date_start'] ) ) {
			return '';
		}

		try {
			$datetime = new DateTime( $item['date_start'] );
			$format   = ( 'hour' === $interval ) ? 'Y-m-d H:00' : 'Y-m-d';
			return $datetime->format( $format );
		} catch ( Exception $e ) {
			return '';
		}
	}

	/**
	 * Format a monetary amount for display in CSV.
	 *
	 * @param mixed $amount The amount to format.
	 * @return string The formatted amount.
	 */
	protected static function format_amount( $amount ): string {
		if ( is_numeric( $amount ) ) {
			return number_format( (float) $amount, 2, '.', '' );
		}
		return '0.00';
	}

	/**
	 * Get the label for a time interval.
	 *
	 * @param string|null $interval The time interval (hour, day, week, month, quarter, year).
	 * @return string The translated interval label.
	 */
	protected function get_interval_label( ?string $interval = null ): string {
		$labels = array(
			'hour'    => __( 'Hour', 'jetpack-premium-analytics' ),
			'day'     => __( 'Day', 'jetpack-premium-analytics' ),
			'week'    => __( 'Week', 'jetpack-premium-analytics' ),
			'month'   => __( 'Month', 'jetpack-premium-analytics' ),
			'quarter' => __( 'Quarter', 'jetpack-premium-analytics' ),
			'year'    => __( 'Year', 'jetpack-premium-analytics' ),
		);

		return $labels[ $interval ?? '' ] ?? __( 'Date', 'jetpack-premium-analytics' );
	}

	/**
	 * Extract data from an item based on prefix matching.
	 *
	 * @param array  $item          The raw data item.
	 * @param string $prefix        The prefix to match against.
	 * @param bool   $match_prefix  If true, include keys with prefix; if false, exclude keys with prefix.
	 * @param bool   $strip_prefix  If true, strip the prefix from extracted keys.
	 * @return array Extracted data item and a flag indicating if all values are empty.
	 */
	protected function extract_data_by_prefix( array $item, string $prefix, bool $match_prefix, bool $strip_prefix = false ): array {
		$extracted_item = array();
		$all_empty      = true;
		$prefix_length  = strlen( $prefix );

		foreach ( $item as $key => $value ) {
			$has_prefix = ( strpos( $key, $prefix ) === 0 );

			// Include key if it matches our criteria (has prefix when match_prefix is true, or doesn't have prefix when match_prefix is false).
			if ( $has_prefix === $match_prefix ) {
				$extracted_key                    = $strip_prefix && $has_prefix ? substr( $key, $prefix_length ) : $key;
				$extracted_item[ $extracted_key ] = $value;

				// Check if all values are empty strings.
				if ( '' !== $value ) {
					$all_empty = false;
				}
			}
		}

		return array(
			'item'      => $extracted_item,
			'all_empty' => $all_empty,
		);
	}

	/**
	 * Format a row with empty value handling.
	 *
	 * Handles empty row checking based on controller configuration:
	 * - Checks configured field(s) for emptiness
	 * - Skips row if configured and empty (unless should_include_empty_rows() is true)
	 * - Includes row with custom label if configured
	 *
	 * If all values in the extracted item are empty strings, returns a row
	 * with all fields set to empty strings instead of using default values.
	 *
	 * @param array       $extracted_data The extracted data item and empty flag.
	 * @param array       $item_to_format The item to use for formatting (may differ from extracted data).
	 * @param string|null $interval       Optional time interval for formatting.
	 * @return array The formatted row, or empty array if row should be skipped.
	 */
	protected function format_row_with_empty_handling( array $extracted_data, array $item_to_format, ?string $interval = null ): array {
		$item      = $extracted_data['item'];
		$all_empty = $extracted_data['all_empty'];

		// Check if this row should be skipped due to empty identifying fields.
		$check_fields = $this->get_empty_row_check_field();
		$is_empty     = ( null !== $check_fields ) ? $this->is_row_empty( $item, $check_fields ) : false;

		if ( $is_empty ) {
			// Row has empty identifying field(s).
			if ( ! $this->should_include_empty_rows() ) {
				// Skip this row entirely.
				return array();
			}
			// Include the row but we'll replace empty identifying field with custom label later.
		}

		// If all values are empty strings, return empty strings for all fields
		// instead of using default values from format_row_for_csv().
		if ( $all_empty && ! empty( $item ) ) {
			// Get the expected field structure by formatting an empty item.
			// This gives us the field names, but we'll set all values to empty strings.
			$row_structure = $this->format_row_for_csv( array(), $interval );
			$row           = array();
			foreach ( array_keys( $row_structure ) as $key ) {
				$row[ $key ] = '';
			}
			return $row;
		}

		// Format the row normally.
		$row = $this->format_row_for_csv( $item_to_format, $interval );

		// If we determined the row is empty but should be included, replace empty identifying field with custom label.
		// $is_empty implies $check_fields is non-null (see above), but check explicitly for the type checker.
		if ( $is_empty && null !== $check_fields && $this->should_include_empty_rows() ) {
			$row = $this->apply_empty_row_label( $row, $check_fields );
		}

		return $row;
	}

	/**
	 * Check if a row is considered empty based on the configured check field(s).
	 *
	 * @param array $item         The data item to check.
	 * @param array $check_fields Array of field names to check for emptiness.
	 * @return bool True if the row is empty, false otherwise.
	 */
	protected function is_row_empty( array $item, array $check_fields ): bool {
		// All specified fields must be empty for the row to be considered empty.
		foreach ( $check_fields as $field ) {
			// Use strict comparison to avoid treating '0' as empty.
			if ( isset( $item[ $field ] ) && '' !== $item[ $field ] ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Apply the custom empty row label to the formatted row.
	 *
	 * Replaces the value of the identifying field(s) with the custom label.
	 * If the field name changed during formatting, child classes should override this method.
	 *
	 * Note: When multiple check fields are configured (e.g., ['campaign', 'label']),
	 * only the first matching empty field receives the label. This is intentional
	 * because the first field is typically the primary identifier (index/label column)
	 * that should be displayed to users. Applying the label to multiple columns would
	 * be redundant and could confuse users.
	 *
	 * @param array $row          The formatted row data.
	 * @param array $check_fields The field names that were empty.
	 * @return array The row with custom label applied.
	 */
	protected function apply_empty_row_label( array $row, array $check_fields ): array {
		$custom_label = $this->get_empty_row_label();

		// Update the specified check field(s) if they exist in the formatted row.
		foreach ( $check_fields as $field_name ) {
			if ( isset( $row[ $field_name ] ) && '' === $row[ $field_name ] ) {
				$row[ $field_name ] = $custom_label;
				return $row; // Only update the first matching empty field.
			}
		}

		return $row;
	}

	/**
	 * Automatically add comparison fields to a formatted row.
	 *
	 * This helper method dynamically adds comparison data by:
	 * 1. Checking if comparison data exists (any comparison_ prefixed field)
	 * 2. Creating a synthetic item with comparison_ prefixes stripped
	 * 3. Calling format_row_for_csv() on the synthetic item (applying all field mapping)
	 * 4. Adding comparison_ prefix back to the formatted keys
	 * 5. Merging into the original row
	 *
	 * This ensures that field name mapping (e.g., orders_value_net → net_sales)
	 * is applied consistently to both base and comparison data.
	 *
	 * @param array       $row      The formatted row with original data.
	 * @param array       $item     The raw item with both original and comparison data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The row with comparison fields added.
	 */
	protected function add_comparison_fields( array $row, array $item, ?string $interval = null ): array {
		$prefix = Report_Data_Fetcher::COMPARISON_INDEX_PREFIX;

		// Check if comparison data exists by looking for any comparison_ prefixed field.
		$has_comparison_data = false;
		foreach ( array_keys( $item ) as $key ) {
			if ( strpos( $key, $prefix ) === 0 ) {
				$has_comparison_data = true;
				break;
			}
		}

		if ( ! $has_comparison_data ) {
			return $row;
		}

		// Extract comparison data with prefix stripped.
		// Note: We format the extracted comparison item (with prefix stripped), not the full item.
		$comparison_data = $this->extract_data_by_prefix( $item, $prefix, true, true );
		$comparison_row  = $this->format_row_with_empty_handling( $comparison_data, $comparison_data['item'], $interval );

		// Add comparison_ prefix back to the formatted keys and merge into main row.
		foreach ( $comparison_row as $key => $value ) {
			$row[ $prefix . $key ] = $value;
		}

		return $row;
	}
}
