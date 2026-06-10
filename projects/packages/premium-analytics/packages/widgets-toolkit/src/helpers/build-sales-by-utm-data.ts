/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { calculateDelta } from './calculate-delta';
import type { LeaderboardChartData } from '../components/chart-leaderboard';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

/**
 * Internal dependencies
 */

/**
 * Builds leaderboard chart data for the Sales by UTM widget.
 *
 * Transforms order attribution data into the format required by LeaderboardChart.
 *
 * @param orderAttribution - Primary period order attribution data
 * @param maxEntries       - Maximum number of entries to include in the leaderboard
 * @return Processed data ready for LeaderboardChart component
 */
export function buildSalesByUtmData(
	orderAttribution: ReportDataMap[ 'order-attribution' ] | undefined,
	maxEntries = 4
): LeaderboardChartData {
	if ( ! orderAttribution?.data || orderAttribution.data.length === 0 ) {
		return [];
	}

	const { data } = orderAttribution;

	// Find the max value for share calculation
	const maxValue = Math.max(
		...data.map( item =>
			Math.max( item.current_period.value || 0, item.previous_period?.value || 0 )
		),
		1 // Prevent division by zero
	);

	return data.slice( 0, maxEntries ).map( ( item, idx ) => {
		const currentValue = item.current_period.value || 0;
		const previousValue = item.previous_period?.value ?? 0;
		const delta = calculateDelta( currentValue, previousValue );

		return {
			id: item.item ? String( item.item ) : String( idx ),
			label: item.item || __( 'Unassigned', 'jetpack-premium-analytics' ),
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta,
		};
	} );
}
