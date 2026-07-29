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
import type { GeoData } from '@automattic/charts';

export type Region = 'US' | 'world';

export type VisitorsByLocationData = {
	geoData: GeoData;
	leaderboardData: LeaderboardChartData;

	/**
	 * Whether any visible leaderboard row has a matching comparison-period row.
	 *
	 * Callers combine this with the date-range comparison state so a period with
	 * no overlapping rows hides comparison mode instead of rendering a column of
	 * placeholders.
	 */
	hasRowComparison: boolean;
};

export type LocationDataEntry = {
	id: string;
	label: string;
	value: number;
};

type BuildVisitorsByLocationDataParams = {
	primaryData: LocationDataEntry[];
	comparisonData?: LocationDataEntry[];
	region: Region;
	limit?: number;
};

/**
 * Build geo chart and leaderboard data from raw location data.
 *
 * @param params                - Build parameters
 * @param params.primaryData    - Primary period data
 * @param params.comparisonData - Comparison period data (optional)
 * @param params.region         - The region ('US' or 'world')
 * @param params.limit          - Maximum number of items for leaderboard (default: 5)
 * @return Geo chart data, leaderboard data, and whether any row has a comparison
 */
export function buildVisitorsByLocationData( {
	primaryData,
	comparisonData,
	region,
	limit = 5,
}: BuildVisitorsByLocationDataParams ): VisitorsByLocationData {
	const headerLabel =
		region === 'US'
			? __( 'State', 'jetpack-premium-analytics-pkg' )
			: __( 'Country', 'jetpack-premium-analytics-pkg' );

	// Build geo chart data
	const geoData: GeoData = [
		[ headerLabel, 'Visitors' ],
		...primaryData.map( item => [ item.label, item.value ] as [ string, number ] ),
	];

	let hasRowComparison = false;
	const comparisonValues = new Map( comparisonData?.map( item => [ item.id, item.value ] ) );
	const visiblePrimaryData = primaryData.slice( 0, limit );
	const maxValue = getCombinedPeriodMax(
		visiblePrimaryData.map( item => item.value ),
		visiblePrimaryData.map( item => comparisonValues.get( item.id ) )
	);

	// Build leaderboard data (top N items)
	const leaderboardData: LeaderboardChartData = visiblePrimaryData.map( item => {
		// A location absent from the comparison period has an unknown previous
		// value, not a real 0, so leave the comparison fields undefined and let
		// the chart show a missing-data placeholder instead of a fabricated delta.
		// A location present with 0 visitors keeps its known comparison value while
		// its unavailable delta renders separately.
		const previousValue = comparisonValues.get( item.id );
		const hasComparisonValue = previousValue !== undefined;

		if ( hasComparisonValue ) {
			hasRowComparison = true;
		}

		return {
			id: item.id,
			label: item.label,
			currentValue: item.value,
			previousValue,
			currentShare: sharePercentage( item.value, maxValue ),
			previousShare: hasComparisonValue ? sharePercentage( previousValue, maxValue ) : undefined,
			delta: hasComparisonValue ? calculateDelta( item.value, previousValue ) : undefined,
		};
	} );

	return { geoData, leaderboardData, hasRowComparison };
}
