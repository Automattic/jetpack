/**
 * External dependencies
 */
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
import type { LegendLabels } from '../components/chart-leaderboard';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Formats chart legend labels from a report's date ranges, falling back to
 * generic "Current period" / "Previous period" labels when a range is missing.
 *
 * @param reportParams - Report parameters containing date ranges
 * @return Object with primary and comparison legend labels
 */
export function formatLegendLabels( reportParams: ReportParams ): LegendLabels {
	const primaryLabel =
		formatDateRange( {
			from: parseSiteDateTime( reportParams.from ),
			to: parseSiteDateTime( reportParams.to ),
		} ) || __( 'Current period', 'jetpack-premium-analytics-pkg' );

	const comparisonLabel =
		reportParams.compare_from && reportParams.compare_to
			? formatDateRange( {
					from: parseSiteDateTime( reportParams.compare_from ),
					to: parseSiteDateTime( reportParams.compare_to ),
			  } ) || __( 'Previous period', 'jetpack-premium-analytics-pkg' )
			: __( 'Previous period', 'jetpack-premium-analytics-pkg' );

	return {
		primary: primaryLabel,
		comparison: comparisonLabel,
	};
}
