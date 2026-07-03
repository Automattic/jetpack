<?php
/**
 * CSV Report Controller Interface
 *
 * Interface defining the contract for CSV report controllers.
 * All CSV report controllers must implement this interface to ensure
 * consistent behavior across the CSV export system.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

/**
 * Interface for CSV report controllers.
 *
 * This interface defines the contract that all CSV report controllers
 * must implement. It ensures consistent behavior across different
 * report types while allowing for flexible implementations.
 *
 * @since x.x.x
 */
interface CSVReportControllerInterface extends RegistrableInterface {

	/**
	 * Get the report key (unique identifier).
	 *
	 * @return string The unique report identifier.
	 */
	public function get_report_key(): string;

	/**
	 * Get the report label (human-readable name).
	 *
	 * @return string The human-readable report name.
	 */
	public function get_report_label(): string;

	/**
	 * Get the data endpoint (API route).
	 *
	 * @return string The API endpoint for fetching report data.
	 */
	public function get_data_endpoint(): string;

	/**
	 * Get the column headers for CSV export.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array Array of column_key => column_label pairs.
	 */
	public function get_column_headers( ?string $interval = null ): array;

	/**
	 * Format a single data item for CSV export.
	 *
	 * This method should return the base row data without comparison fields.
	 * Comparison fields are automatically added by format_row_with_comparison().
	 *
	 * @param array $item The raw data item.
	 * @return array The formatted row for CSV.
	 */
	public function format_row_for_csv( array $item ): array;

	/**
	 * Get default values for missing data fields.
	 *
	 * This method should return an array of default values for all possible fields
	 * in this report. Used when creating empty items for missing comparison data.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array;

	/**
	 * Get the batch limit (max items per request).
	 *
	 * @return int The maximum number of items per batch.
	 */
	public function get_batch_limit(): int;

	/**
	 * Format a row with automatic comparison field handling.
	 *
	 * This method wraps format_row_for_csv() and automatically adds
	 * comparison fields if present in the data.
	 *
	 * @param array $item The raw data item.
	 * @return array The formatted row with comparison fields.
	 */
	public function format_row_with_comparison( array $item ): array;
}
