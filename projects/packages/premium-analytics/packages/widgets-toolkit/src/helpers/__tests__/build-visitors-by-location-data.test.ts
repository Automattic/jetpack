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

	it( 'leaves comparison fields undefined for a location absent from the comparison period', () => {
		const { leaderboardData } = buildVisitorsByLocationData( {
			primaryData,
			comparisonData,
			region: 'world',
		} );

		const japan = leaderboardData.find( row => row.id === 'JP' );

		// No matching comparison row → em dash, not a fabricated +100%.
		expect( japan?.previousValue ).toBeUndefined();
		expect( japan?.previousShare ).toBeUndefined();
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
} );
