/**
 * Shared utilities for handling empty chart data states.
 * Used by BarChart, ComparativeLineChart, DonutChart, and SemiCircleChart.
 */

/**
 * External dependencies
 */
import type { DataPointPercentage } from '@automattic/charts';

/**
 * Series data shape for bar and line charts (nested array format).
 */
type SeriesWithData = {
	data: Array< { value: number | null } >;
};

/**
 * Checks if chart data is empty (all values are 0 or null).
 * Used to disable tooltips and apply fixed Y-axis domains when there's no meaningful data.
 *
 * @param series - Array of series data to check
 * @return True if all values across all series are 0 or null
 */
export function isEmptyChartData( series: SeriesWithData[] ): boolean {
	return series.every( s => s.data.every( point => point.value === 0 || point.value === null ) );
}

/**
 * Checks if pie chart data is empty (all values are 0).
 * Used for DonutChart and SemiCircleChart.
 *
 * @param data - Array of DataPointPercentage to check
 * @return True if data is empty or all values are 0
 */
export function isEmptyPieChartData( data: DataPointPercentage[] | undefined | null ): boolean {
	if ( ! data || data.length === 0 ) {
		return true;
	}
	return data.every( item => item.value === 0 );
}

/**
 * Returns a sensible Y-axis domain for empty chart data based on metric type.
 * Each domain is chosen to produce evenly spaced, readable tick values:
 * - currency: 0-4K (ticks: 0, 1K, 2K, 3K, 4K)
 * - percentage: 0-1.0 (ticks: 0%, 25%, 50%, 75%, 100%)
 * - number: 0-80 (ticks: 0, 20, 40, 60, 80)
 *
 * @param metricType - The type of data format (currency, number, percentage)
 * @return Y-axis domain tuple [min, max]
 */
export function getEmptyChartDomain( metricType: string ): [ number, number ] {
	if ( metricType === 'currency' ) {
		return [ 0, 4000 ];
	}

	if ( metricType === 'percentage' ) {
		return [ 0, 1.0 ];
	}

	// Default for 'number' and other types
	return [ 0, 80 ];
}
