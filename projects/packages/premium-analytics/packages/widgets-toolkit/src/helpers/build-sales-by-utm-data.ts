/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { calculateDelta } from './calculate-delta';
import { sharePercentage } from './share-percentage';
import type { LeaderboardChartData } from '../components/chart-leaderboard/leaderboard-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

/**
 * Builds leaderboard chart data for the Sales by UTM widget.
 *
 * Transforms order attribution data into the format required by LeaderboardChart.
 *
 * @param orderAttribution - Primary period order attribution data.
 * @param maxEntries       - Maximum number of entries to include in the leaderboard.
 * @return Processed data ready for LeaderboardChart.
 */
export function buildSalesByUtmData(
	orderAttribution: ReportDataMap[ 'order-attribution' ] | undefined,
	maxEntries = 4
): LeaderboardChartData {
	if ( ! orderAttribution?.data || orderAttribution.data.length === 0 ) {
		return [];
	}

	const { data } = orderAttribution;

	const maxValue = Math.max(
		...data.map( item =>
			Math.max( item.current_period.value || 0, item.previous_period?.value || 0 )
		),
		1
	);

	return data.slice( 0, maxEntries ).map( ( item, idx ) => {
		const currentValue = item.current_period.value || 0;

		// A source absent from the comparison period has an unknown previous
		// value, not a real 0, so leave the comparison fields undefined and let
		// the chart show a missing-data placeholder. A source present with 0
		// sales keeps its known comparison value while its unavailable delta
		// renders separately.
		const previousValue = item.previous_period?.value;
		const hasComparisonValue = previousValue !== undefined;

		return {
			id: item.item ? String( item.item ) : String( idx ),
			label: item.item || __( 'Unassigned', 'jetpack-premium-analytics' ),
			currentValue,
			previousValue,
			currentShare: sharePercentage( currentValue, maxValue ),
			previousShare: hasComparisonValue ? sharePercentage( previousValue, maxValue ) : undefined,
			delta: hasComparisonValue ? calculateDelta( currentValue, previousValue ) : undefined,
		};
	} );
}
