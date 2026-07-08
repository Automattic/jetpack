<?php
/**
 * Merge Strategy Interface
 *
 * Defines the contract for comparison data merge strategies.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\CSVReportControllerInterface;

/**
 * Interface for merge strategies.
 *
 * Merge strategies determine how original and comparison period data
 * are combined for CSV export.
 *
 * @since $$next-version$$
 */
interface MergeStrategyInterface {

	/**
	 * Merge original and comparison data items.
	 *
	 * @param array                        $original_items   Items from original period.
	 * @param array                        $comparison_items Items from comparison period.
	 * @param string                       $prefix           Prefix for comparison field names.
	 * @param CSVReportControllerInterface $controller       Controller for default values and config.
	 * @return array Merged items with comparison data.
	 */
	public function merge( array $original_items, array $comparison_items, string $prefix, CSVReportControllerInterface $controller ): array;
}
