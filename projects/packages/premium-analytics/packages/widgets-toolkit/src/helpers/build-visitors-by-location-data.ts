/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { LeaderboardChartData } from '../components/chart-leaderboard/leaderboard-chart';
import type { GeoData } from '@automattic/charts';

export type Region = 'US' | 'world';

export type VisitorsByLocationData = {
	geoData: GeoData;
	leaderboardData: LeaderboardChartData;
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
 * @return Geo chart data and leaderboard data
 */
export function buildVisitorsByLocationData( {
	primaryData,
	comparisonData,
	region,
	limit = 5,
}: BuildVisitorsByLocationDataParams ): VisitorsByLocationData {
	const headerLabel =
		region === 'US'
			? __( 'State', 'jetpack-premium-analytics' )
			: __( 'Country', 'jetpack-premium-analytics' );

	// Build geo chart data
	const geoData: GeoData = [
		[ headerLabel, 'Visitors' ],
		...primaryData.map( item => [ item.label, item.value ] as [ string, number ] ),
	];

	// Find max values for bar width scaling (largest value = 100% width)
	const maxPrimaryValue = Math.max( ...primaryData.map( d => d.value ), 0 );
	const maxComparisonValue = comparisonData
		? Math.max( ...comparisonData.map( d => d.value ), 0 )
		: 0;

	// Build leaderboard data (top N items)
	const leaderboardData: LeaderboardChartData = primaryData.slice( 0, limit ).map( item => {
		const comparisonItem = comparisonData?.find( c => c.id === item.id );
		const comparisonValue = comparisonItem?.value ?? 0;
		const currentShare = maxPrimaryValue > 0 ? ( item.value / maxPrimaryValue ) * 100 : 0;

		// A location absent from the comparison period has an unknown previous
		// value, not a real 0. Leave the comparison fields undefined so the
		// chart shows an em dash instead of a fabricated delta.
		const hasComparisonValue = comparisonValue > 0;
		const previousShare =
			hasComparisonValue && maxComparisonValue > 0
				? ( comparisonValue / maxComparisonValue ) * 100
				: undefined;
		const delta = hasComparisonValue
			? ( ( item.value - comparisonValue ) / comparisonValue ) * 100
			: undefined;

		return {
			id: item.id,
			label: item.label,
			currentValue: item.value,
			previousValue: hasComparisonValue ? comparisonValue : undefined,
			currentShare,
			previousShare,
			delta,
		};
	} );

	return { geoData, leaderboardData };
}
