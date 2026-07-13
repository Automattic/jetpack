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
 * @since $$next-version$$
 */
interface Csv_Report_Controller_Interface extends Registrable_Interface {

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
	 * @param array       $item     The raw data item.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row for CSV.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array;

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
	 * Get the matching field for comparison data alignment.
	 *
	 * For ranked reports (top products, sales by coupon), return the field name
	 * to use for matching rows between periods (e.g., 'product_id', 'coupon_code').
	 * For time-series reports, return null to use index-based matching.
	 *
	 * @return string|null The field name for ID-based matching, or null for index-based.
	 */
	public function get_matching_field(): ?string;

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * For ranked reports with ID-based matching, these fields (like 'product_name',
	 * 'coupon_code') should be copied from the original period to comparison period
	 * when comparison data is missing. This ensures the entity name is always shown
	 * even when there was no activity in the comparison period.
	 *
	 * @return array Array of field names to preserve, or empty array for none.
	 */
	public function get_identifying_fields(): array;

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
	public function format_row_with_comparison( array $item, ?string $interval = null ): array;

	/**
	 * Whether to use array format for filter values in IN filters.
	 *
	 * When true, filters are built as: filters[0][value][]=id1&filters[0][value][]=id2
	 * When false (default), filters are built as: filters[0][value]=id1,id2 (more URL-efficient)
	 *
	 * Order-attribution endpoints require array format, while most other endpoints
	 * accept comma-separated values which are more URL-efficient.
	 *
	 * @return bool True to use array format, false for comma-separated (default).
	 */
	public function use_array_filter_format(): bool;

	/**
	 * Whether to include rows with empty identifying fields in the export.
	 *
	 * When true, rows with empty identifying fields will be included in the export
	 * with a custom label. When false (default), they will be skipped.
	 *
	 * This is used by Report_Data_Fetcher when building ID filters for comparison data
	 * to ensure comparison data is fetched for empty rows when needed.
	 *
	 * @return bool True to include empty rows with custom label, false to skip them.
	 */
	public function should_include_empty_rows(): bool;

	/**
	 * Get the list of fields to request from the API.
	 *
	 * Return only the fields needed for this report to reduce API response
	 * payload size. Return an empty array to request all fields (default).
	 *
	 * @return array Field names to request, or empty array for all fields.
	 */
	public function get_fields(): array;

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Controller-specific query parameters merged into every data request
	 * (e.g. date_type, orderby, order, limit).
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array;
}
