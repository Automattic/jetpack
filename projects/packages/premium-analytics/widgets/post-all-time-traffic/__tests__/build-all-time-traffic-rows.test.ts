/**
 * Internal dependencies
 */
import { buildAllTimeTrafficRows, resolveMetric } from '../build-all-time-traffic-rows';
import type { StatsPostResponse } from '@jetpack-premium-analytics/data';

// The endpoint keys months `1`-`12` and leaves out months without views.
const RESPONSE: StatsPostResponse = {
	years: {
		'2025': { total: 30, months: { '11': 10, '12': 20 } },
		'2026': { total: 45, months: { '1': 5, '3': 40 } },
	},
	averages: {
		'2025': { overall: 1, months: { '11': 1, '12': 2 } },
		'2026': { overall: 3, months: { '1': 1, '3': 8 } },
	},
};

const TODAY = { year: 2026, month: 2 };

describe( 'buildAllTimeTrafficRows', () => {
	it( 'returns one row per year of the post, newest first', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY );

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025 ] );
	} );

	it( 'draws every month of the post life, zeroing the ones the endpoint left out', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY );

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
		const rows = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, { year: 2025, month: 8 } );

		expect( rows[ 1 ].months.slice( 7, 11 ) ).toEqual( [ 'before', 0, 0, 10 ] );
	} );

	it( 'keeps stats from before the publish month', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, { year: 2026, month: 0 } );

		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
	} );

	it( 'keeps the table open through the current month when the endpoint runs behind', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, 'total', { year: 2026, month: 5 } );

		expect( rows[ 0 ].months[ 5 ] ).toBe( 0 );
		expect( rows[ 0 ].months[ 6 ] ).toBe( 'after' );
	} );

	it( 'reads the per-day averages under the average metric, over the months years reports', () => {
		const rows = buildAllTimeTrafficRows( RESPONSE, 'average', TODAY );

		expect( rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 1, 0, 8 ] );
		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 1, 2 ] );
	} );

	it( 'returns no rows under the average metric without its table', () => {
		expect( buildAllTimeTrafficRows( { years: RESPONSE.years }, 'average', TODAY ) ).toEqual( [] );
	} );

	it( 'returns no rows without yearly stats', () => {
		expect( buildAllTimeTrafficRows( undefined, 'total', TODAY ) ).toEqual( [] );
		expect( buildAllTimeTrafficRows( { years: {} }, 'total', TODAY ) ).toEqual( [] );
	} );
} );

describe( 'resolveMetric', () => {
	it( 'reads a stored metric and falls back to total views', () => {
		expect( resolveMetric( 'average' ) ).toBe( 'average' );
		expect( resolveMetric( 'total' ) ).toBe( 'total' );
		expect( resolveMetric( undefined ) ).toBe( 'total' );
		expect( resolveMetric( 'views' ) ).toBe( 'total' );
	} );
} );
