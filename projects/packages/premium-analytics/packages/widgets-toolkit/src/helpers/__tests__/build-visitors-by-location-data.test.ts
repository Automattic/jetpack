/**
 * Internal dependencies
 */
import {
	buildVisitorsByLocationData,
	type LocationDataEntry,
} from '../build-visitors-by-location-data';

const primaryData: LocationDataEntry[] = [
	{ id: 'US', label: 'United States', value: 4 },
	{ id: 'TW', label: 'Taiwan', value: 1 },
	{ id: 'JP', label: 'Japan', value: 1 },
];

// United States and Taiwan overlap the current period; Singapore replaces Japan,
// so Japan has no matching comparison-period value.
const comparisonData: LocationDataEntry[] = [
	{ id: 'US', label: 'United States', value: 4 },
	{ id: 'TW', label: 'Taiwan', value: 1 },
	{ id: 'SG', label: 'Singapore', value: 1 },
];

describe( 'buildVisitorsByLocationData', () => {
	it( 'keeps a real delta for locations present in both periods', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData,
			region: 'world',
		} );

		const [ us, tw ] = leaderboardData;

		// Equal values in both periods → genuine 0% change, not an em dash.
		expect( us.previousValue ).toBe( 4 );
		expect( us.delta ).toBe( 0 );
		expect( tw.previousValue ).toBe( 1 );
		expect( tw.delta ).toBe( 0 );
	} );

	it( 'scales both periods against their combined maximum', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData: [
				{ id: 'US', label: 'United States', value: 8 },
				{ id: 'TW', label: 'Taiwan', value: 2 },
			],
			region: 'world',
		} );

		const [ us ] = leaderboardData;

		expect( us.currentShare ).toBe( 50 );
		expect( us.previousShare ).toBe( 100 );
	} );

	it( 'leaves comparison fields undefined for a location absent from the comparison period', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData,
			region: 'world',
		} );

		const japan = leaderboardData.find( row => row.id === 'JP' );

		// No matching comparison row → comparison fields stay undefined, so the
		// chart shows the missing-data placeholder rather than implying a real 0.
		expect( japan?.previousValue ).toBeUndefined();
		expect( japan?.previousShare ).toBeUndefined();
		expect( japan?.delta ).toBeUndefined();
	} );

	it( 'keeps comparison fields for a location with a real zero value', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData: [ ...comparisonData, { id: 'JP', label: 'Japan', value: 0 } ],
			region: 'world',
		} );

		const japan = leaderboardData.find( row => row.id === 'JP' );

		// A real 0 is a known previous value, but its percentage change is undefined.
		expect( japan?.previousValue ).toBe( 0 );
		expect( japan?.previousShare ).toBe( 0 );
		expect( japan?.delta ).toBeUndefined();
	} );

	it( 'leaves comparison fields undefined for every row when no comparison data is provided', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			region: 'world',
		} );

		for ( const row of leaderboardData ) {
			expect( row.previousValue ).toBeUndefined();
			expect( row.previousShare ).toBeUndefined();
			expect( row.delta ).toBeUndefined();
		}
	} );

	it( 'reports a row comparison when at least one location overlaps', () => {
		const { hasRowComparison } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData,
			region: 'world',
		} );

		// Partial overlap still counts: matching rows keep their deltas, and the
		// unmatched ones fall back to the placeholder.
		expect( hasRowComparison ).toBe( true );
	} );

	it( 'reports no row comparison when no location overlaps', () => {
		const { hasRowComparison } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData: [
				{ id: 'SG', label: 'Singapore', value: 3 },
				{ id: 'KR', label: 'South Korea', value: 2 },
			],
			region: 'world',
		} );

		// Every row would render a placeholder, so callers suppress comparison mode.
		expect( hasRowComparison ).toBe( false );
	} );

	it( 'reports no row comparison when no comparison data is provided', () => {
		const { hasRowComparison } = buildVisitorsByLocationData( {
			primaryData,
			region: 'world',
		} );

		expect( hasRowComparison ).toBe( false );
	} );

	it( 'ignores overlap that falls outside the visible rows', () => {
		const { hasRowComparison } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData: [ { id: 'JP', label: 'Japan', value: 2 } ],
			region: 'world',
			limit: 1,
		} );

		// Japan overlaps but is cut off by the limit, so no visible row has a
		// comparison to show.
		expect( hasRowComparison ).toBe( false );
	} );
} );
