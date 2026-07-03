<?php
/**
 * Abstract CSV Report Controller
 *
 * Base class for CSV export report controllers. Provides common functionality
 * for formatting and exporting report data to CSV via the new ReportRegistry system.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use DateTime;
use Exception;

/**
 * Abstract base class for CSV report controllers.
 *
 * NOTE: This is a proof-of-concept implementation. Future work will migrate
 * all export controllers to use this pattern.
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
 * - Auto-registration with ReportRegistry in constructor
 * - Automatic comparison field handling via format_row_with_comparison()
 * - Helper methods for common formatting tasks
 *
 * @since x.x.x
 */
abstract class AbstractCSVReportController implements CSVReportControllerInterface {

	/**
	 * Default batch limit for time-based reports (1000 items).
	 */
	protected const DEFAULT_BATCH_LIMIT = 1000;

	/**
	 * Report registry instance.
	 *
	 * @var ReportRegistry
	 */
	protected $registry;

	/**
	 * Constructor.
	 *
	 * @param ReportRegistry $registry Registry instance (injected by DI).
	 */
	public function __construct( ReportRegistry $registry ) {
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
	 * @param array $item The raw data item.
	 * @return array The formatted row with comparison fields.
	 */
	public function format_row_with_comparison( array $item ): array {
		$row = $this->format_row_for_csv( $item );
		return $this->add_comparison_fields( $row, $item );
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
	 * @param array $item The raw data item.
	 * @return array The formatted row for CSV.
	 */
	abstract public function format_row_for_csv( array $item ): array;

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

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Format a time interval for display in CSV.
	 *
	 * @param array $item The data item containing date_start.
	 * @return string The formatted date string.
	 */
	protected function format_time_interval( array $item ): string {
		if ( ! isset( $item['date_start'] ) || empty( $item['date_start'] ) ) {
			return '';
		}

		try {
			$datetime = new DateTime( $item['date_start'] );
			return $datetime->format( 'Y-m-d' );
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
	protected function get_interval_label( ?string $interval ): string {
		$labels = array(
			'hour'    => __( 'Hour', 'jetpack-premium-analytics' ),
			'day'     => __( 'Day', 'jetpack-premium-analytics' ),
			'week'    => __( 'Week', 'jetpack-premium-analytics' ),
			'month'   => __( 'Month', 'jetpack-premium-analytics' ),
			'quarter' => __( 'Quarter', 'jetpack-premium-analytics' ),
			'year'    => __( 'Year', 'jetpack-premium-analytics' ),
		);

		return $labels[ $interval ] ?? __( 'Date', 'jetpack-premium-analytics' );
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
	 * @param array $row  The formatted row with original data.
	 * @param array $item The raw item with both original and comparison data.
	 * @return array The row with comparison fields added.
	 */
	protected function add_comparison_fields( array $row, array $item ): array {
		$prefix        = ReportDataFetcher::COMPARISON_INDEX_PREFIX;
		$prefix_length = strlen( $prefix );

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

		// Create a synthetic item with comparison_ prefixes stripped.
		// This allows format_row_for_csv() to apply the same field mapping logic.
		$comparison_item = array();
		foreach ( $item as $key => $value ) {
			if ( strpos( $key, $prefix ) === 0 ) {
				$stripped_key                     = substr( $key, $prefix_length );
				$comparison_item[ $stripped_key ] = $value;
			}
		}

		// Call format_row_for_csv() on the comparison item.
		// This applies all field mapping (e.g., orders_value_net → net_sales).
		$comparison_row = $this->format_row_for_csv( $comparison_item );

		// Add comparison_ prefix back to the formatted keys and merge into main row.
		foreach ( $comparison_row as $key => $value ) {
			$row[ $prefix . $key ] = $value;
		}

		return $row;
	}
}
