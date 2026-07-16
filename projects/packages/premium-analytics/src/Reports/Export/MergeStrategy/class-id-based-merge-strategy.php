<?php
/**
 * ID-Based Merge Strategy
 *
 * Merges comparison data by matching field value for ranked reports.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Csv_Report_Controller_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;

/**
 * ID-based merge strategy for ranked reports.
 *
 * This strategy merges data by matching a specific field (e.g., product_id, coupon_code).
 * It's appropriate for ranked reports like Top Products where items may appear in
 * different positions between periods.
 *
 * Empty value handling: Uses controller defaults (e.g., 0 for numeric fields) for missing
 * comparison data, which signals "no sales/activity" rather than "no data".
 *
 * @since $$next-version$$
 */
class Id_Based_Merge_Strategy extends Abstract_Merge_Strategy {

	use Logger_Trait;

	/**
	 * The matching field name (e.g., 'product_id').
	 *
	 * @var string
	 */
	private $matching_field;

	/**
	 * Constructor.
	 *
	 * @param string           $matching_field The field to match on.
	 * @param Logger_Interface $logger         Logger instance.
	 */
	public function __construct( string $matching_field, Logger_Interface $logger ) {
		$this->matching_field = $matching_field;
		$this->logger         = $logger;
	}

	/**
	 * Merge original and comparison data by matching field value.
	 *
	 * @param array                           $original_items   Items from original period.
	 * @param array                           $comparison_items Items from comparison period.
	 * @param string                          $prefix           Prefix for comparison field names.
	 * @param Csv_Report_Controller_Interface $controller       Controller for defaults and identifying fields.
	 * @return array Merged items with comparison data.
	 */
	public function merge( array $original_items, array $comparison_items, string $prefix, Csv_Report_Controller_Interface $controller ): array {
		// Build lookup: matching_field value => comparison item.
		// Normalize keys to strings to avoid type mismatch issues (e.g., integer 19 vs string "19").
		// Empty strings are normalized to "" to allow matching empty rows.
		$comparison_map = array();
		foreach ( $comparison_items as $item ) {
			if ( isset( $item[ $this->matching_field ] ) ) {
				// Normalize to string, preserving empty strings as "" (not converting to null).
				$field_value    = $item[ $this->matching_field ];
				$normalized_key = ( null !== $field_value ) ? (string) $field_value : '';

				// Warn if there are duplicate matching field values.
				if ( isset( $comparison_map[ $normalized_key ] ) ) {
					$this->logger->log_error(
						sprintf(
							'Duplicate matching field value "%s" found in comparison data. Only the last occurrence will be used.',
							$normalized_key
						),
						__METHOD__
					);
				}

				$comparison_map[ $normalized_key ] = $item;
			}
		}

		// Get template for empty comparison data.
		$comparison_template = ! empty( $comparison_items )
			? $comparison_items[0]
			: ( ! empty( $original_items ) ? $original_items[0] : array() );

		$merged_items = array();

		// Match original items with comparison data.
		foreach ( $original_items as $original_item ) {
			$merged_item = $original_item;
			$match_value = $original_item[ $this->matching_field ] ?? null;

			// Warn if the matching field is missing from this item.
			if ( ! isset( $original_item[ $this->matching_field ] ) ) {
				$this->logger->log_error(
					sprintf(
						'Item missing matching field "%s". Item will have empty comparison data. Available fields: %s',
						$this->matching_field,
						implode( ', ', array_keys( $original_item ) )
					),
					__METHOD__
				);
			}

			// Normalize match value to string for consistent lookup.
			// Preserve empty strings as "" (not converting to null) to allow matching empty rows.
			// This allows falsy but valid values like 0 or "0" to be matched, and also allows
			// empty strings to be matched (important for empty row handling).
			$normalized_match_value = ( null !== $match_value ) ? (string) $match_value : '';

			if ( isset( $comparison_map[ $normalized_match_value ] ) ) {
				// Found matching comparison data.
				foreach ( $comparison_map[ $normalized_match_value ] as $key => $value ) {
					$merged_item[ $prefix . $key ] = $value;
				}
			} else {
				// No match - use default values (NOT empty strings).
				$empty_comparison = $this->create_empty_item( $comparison_template, $controller );
				foreach ( $empty_comparison as $key => $value ) {
					$merged_item[ $prefix . $key ] = $value;
				}
			}

			// Copy matching field and identifying/display fields from original item when comparison fields are empty.
			// This handles both cases: when comparison data is missing entirely, and when
			// comparison data exists but identifying fields are empty.
			// The entity is the same (matched by ID), so these fields should be preserved.
			$this->copy_matching_and_identifying_fields( $merged_item, $original_item, $prefix, $controller );

			$merged_items[] = $merged_item;
		}

		return $merged_items;
	}

	/**
	 * Copy matching field and identifying fields from original item to comparison item.
	 *
	 * When matching by ID, the entity is the same across periods, so the matching field
	 * (e.g., 'channel', 'device') and identifying fields (e.g., 'label') should be preserved
	 * even when comparison data is missing.
	 *
	 * @param array                           $merged_item   The merged item (modified in place).
	 * @param array                           $original_item The original item to copy from.
	 * @param string                          $prefix        The prefix for comparison fields.
	 * @param Csv_Report_Controller_Interface $controller    Controller specifying which fields to preserve.
	 * @return void
	 */
	private function copy_matching_and_identifying_fields( array &$merged_item, array $original_item, string $prefix, Csv_Report_Controller_Interface $controller ): void {
		// Build list of fields to copy: matching field + identifying fields.
		$fields_to_copy     = array( $this->matching_field );
		$identifying_fields = $controller->get_identifying_fields();
		if ( ! empty( $identifying_fields ) ) {
			$fields_to_copy = array_merge( $fields_to_copy, $identifying_fields );
		}

		// Copy each field from original to comparison if needed.
		foreach ( $fields_to_copy as $field ) {
			// Skip if the field doesn't exist in the original item.
			if ( ! isset( $original_item[ $field ] ) ) {
				continue;
			}

			$value = $original_item[ $field ];

			// Skip if the value is empty string.
			// Note: We check for empty string explicitly to allow "0" strings and other falsy values.
			if ( '' === $value ) {
				continue;
			}

			$comparison_key = $prefix . $field;
			// Only copy if the comparison field is missing or is an empty string.
			// Note: We check for empty string explicitly to allow "0" strings.
			if ( ! isset( $merged_item[ $comparison_key ] ) || '' === $merged_item[ $comparison_key ] ) {
				$merged_item[ $comparison_key ] = $value;
			}
		}
	}
}
