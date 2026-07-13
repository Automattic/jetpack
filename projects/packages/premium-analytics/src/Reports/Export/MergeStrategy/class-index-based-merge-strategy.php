<?php
/**
 * Index-Based Merge Strategy
 *
 * Merges comparison data by array position for time-series reports.
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
 * Index-based merge strategy for time-series reports.
 *
 * This strategy merges data by array position (row 0 with row 0, row 1 with row 1, etc.).
 * It's appropriate for time-series reports where dates align between periods.
 *
 * Empty value handling: Uses empty strings for missing data, which signals
 * "no data for this date" when period lengths don't match.
 *
 * @since $$next-version$$
 */
class Index_Based_Merge_Strategy extends Abstract_Merge_Strategy {

	use Logger_Trait;

	/**
	 * Constructor.
	 *
	 * @param Logger_Interface $logger Logger instance.
	 */
	public function __construct( Logger_Interface $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Merge original and comparison data by array index.
	 *
	 * @param array                           $original_items   Items from original period.
	 * @param array                           $comparison_items Items from comparison period.
	 * @param string                          $prefix           Prefix for comparison field names.
	 * @param Csv_Report_Controller_Interface $controller       Controller (not used for index-based).
	 * @return array Merged items with comparison data.
	 */
	public function merge( array $original_items, array $comparison_items, string $prefix, Csv_Report_Controller_Interface $controller ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the merge strategy interface; index-based merging aligns by position, not by controller.
		// Get template items for creating empty rows.
		$original_template   = ! empty( $original_items ) ? $original_items[0] : array();
		$comparison_template = ! empty( $comparison_items ) ? $comparison_items[0] : array();

		// Use a copy of a template if the other template is empty (i.e., no data in that set).
		if ( empty( $comparison_template ) && ! empty( $original_template ) ) {
			$comparison_template = $original_template;
		}
		if ( empty( $original_template ) && ! empty( $comparison_template ) ) {
			$original_template = $comparison_template;
		}

		$max_length   = max( count( $original_items ), count( $comparison_items ) );
		$merged_items = array();

		for ( $i = 0; $i < $max_length; $i++ ) {
			$merged_item = array();

			// Add original data (or empty marker).
			if ( isset( $original_items[ $i ] ) ) {
				$merged_item = $original_items[ $i ];
			} else {
				// Use null for controller to ensure empty strings instead of default values (e.g., 0).
				$merged_item = $this->create_empty_item( $original_template, null );
			}

			// Add comparison data with prefix (or empty marker).
			if ( isset( $comparison_items[ $i ] ) ) {
				foreach ( $comparison_items[ $i ] as $key => $value ) {
					$merged_item[ $prefix . $key ] = $value;
				}
			} else {
				// Use null for controller to ensure empty strings instead of default values (e.g., 0).
				$empty_comparison = $this->create_empty_item( $comparison_template, null );
				foreach ( $empty_comparison as $key => $value ) {
					$merged_item[ $prefix . $key ] = $value;
				}
			}

			$merged_items[] = $merged_item;
		}

		return $merged_items;
	}
}
