/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { calculateDelta } from './calculate-delta';
import { getCombinedPeriodMax } from './get-combined-period-max';
import { sharePercentage } from './share-percentage';
import type { LeaderboardChartData } from '../components/chart-leaderboard/leaderboard-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

/**
 * Builds leaderboard chart data for the Sales by UTM widget.
 *
 * Transforms order attribution data into the format required by LeaderboardChart.
 *
 * @param orderAttribution - Primary period order attribution data.
 * @param maxEntries       - Maximum number of entries to include in the leaderboard; 0 keeps
 *                         every row, matching the `max` widget attribute convention.
 * @return Processed data ready for LeaderboardChart.
 */
export function buildSalesByUtmData(
	orderAttribution: ReportDataMap[ 'order-attribution' ] | undefined,
	maxEntries = 4
): LeaderboardChartData {
	if ( ! orderAttribution?.data || orderAttribution.data.length === 0 ) {
		return [];
	}

	const data = orderAttribution.data.slice( 0, maxEntries > 0 ? maxEntries : undefined );

	// The order-attribution summary reports both periods for every row (see
	// SanitizedOrderAttributionSummaryItem), so unlike the row-matched stats
	// leaderboards there is no missing-comparison case to keep undefined here.
	const maxValue = getCombinedPeriodMax(
		data.map( item => item.current_period.value || 0 ),
		data.map( item => item.previous_period.value || 0 )
	);

	return data.map( ( item, idx ) => {
		const currentValue = item.current_period.value || 0;

		// The attribution summary aggregates every order, so it always reports a
		// previous_period: a source with no sales in the comparison period is a
		// real 0, not missing data, and its unavailable delta renders as the
		// placeholder.
		const previousValue = item.previous_period.value || 0;

		return {
			id: item.item ? String( item.item ) : String( idx ),
			label: item.item || __( 'Unassigned', 'jetpack-premium-analytics-pkg' ),
			currentValue,
			previousValue,
			currentShare: sharePercentage( currentValue, maxValue ),
			previousShare: sharePercentage( previousValue, maxValue ),
			delta: calculateDelta( currentValue, previousValue ),
		};
	} );
}
