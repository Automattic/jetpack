/**
 * Internal dependencies
 */
import { buildAllTimeTrafficRows } from '../build-all-time-traffic-rows';
import type { StatsPostResponse } from '@jetpack-premium-analytics/data';

// The endpoint keys months `1`-`12` and leaves out months without views.
const RESPONSE: StatsPostResponse = {
	years: {
		'2025': { total: 30, months: { '11': 10, '12': 20 } },
		'2026': { total: 45, months: { '1': 5, '3': 40 } },
	},
};

const TODAY = { year: 2026, month: 2 };

describe( 'buildAllTimeTrafficRows', () => {
	it( 'returns one row per year of the post, newest first', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, TODAY );

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025 ] );
	} );

	it( 'draws every month of the post life, zeroing the ones the endpoint left out', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, TODAY );

		expect( rows[ 1 ].months ).toEqual( [
			'before',
			'before',
			'before',
			'before',
			'before',
			'before',
			'before',
			'before',
			'before',
			'before',
			10,
			20,
		] );
		// February is inside the life but unreported; April onward is the future.
		expect( rows[ 0 ].months ).toEqual( [
			5,
			0,
			40,
			'after',
			'after',
			'after',
			'after',
			'after',
			'after',
			'after',
			'after',
			'after',
		] );
	} );

	it( 'starts the life at the publish month when that is earlier than the first stats', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, TODAY, { year: 2025, month: 8 } );

		expect( rows[ 1 ].months.slice( 7, 11 ) ).toEqual( [ 'before', 0, 0, 10 ] );
	} );

	it( 'keeps stats from before the publish month', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, TODAY, { year: 2026, month: 0 } );

		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
	} );

	it( 'keeps the table open through the current month when the endpoint runs behind', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, { year: 2026, month: 5 } );

		expect( rows[ 0 ].months[ 5 ] ).toBe( 0 );
		expect( rows[ 0 ].months[ 6 ] ).toBe( 'after' );
	} );

	it( 'returns no rows without yearly stats', () => {
		expect( buildAllTimeTrafficRows( undefined, TODAY ) ).toEqual( [] );
		expect( buildAllTimeTrafficRows( { years: {} }, TODAY ) ).toEqual( [] );
	} );
} );
