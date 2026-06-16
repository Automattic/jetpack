/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import type { LegendLabels } from '../components/chart-leaderboard';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Internal dependencies
 */

/**
 * Formats legend labels from report parameters.
 *
 * Creates human-readable legend labels for chart comparisons based on the
 * date ranges in the report parameters. If date ranges are not available,
 * returns default period labels.
 *
 * @param reportParams - Report parameters containing date ranges
 * @return Object with primary and comparison legend labels
 *
 * @example
 * ```ts
 * const labels = formatLegendLabels({
 *   from: '2024-01-01',
 *   to: '2024-01-31',
 *   compare_from: '2023-12-01',
 *   compare_to: '2023-12-31',
 *   interval: 'day'
 * });
 * // Returns: { primary: 'Jan 1 - 31, 2024', comparison: 'Dec 1 - 31, 2023' }
 * ```
 */
export function formatLegendLabels( reportParams: ReportParams ): LegendLabels {
	const primaryLabel = formatDateRange( {
		from: new Date( reportParams.from ),
		to: new Date( reportParams.to ),
	} );

	const comparisonLabel =
		reportParams.compare_from && reportParams.compare_to
			? formatDateRange( {
					from: new Date( reportParams.compare_from ),
					to: new Date( reportParams.compare_to ),
			  } )
			: __( 'Previous period', 'jetpack-premium-analytics' );

	return {
		primary: primaryLabel,
		comparison: comparisonLabel,
	};
}
