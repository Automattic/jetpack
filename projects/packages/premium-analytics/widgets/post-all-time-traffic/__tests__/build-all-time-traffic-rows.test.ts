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
	averages: {
		'2025': { overall: 1, months: { '11': 1, '12': 2 } },
		'2026': { overall: 3, months: { '1': 1, '3': 8 } },
	},
};

// Mid-March: the current month has 15 days so far.
const TODAY = new Date( 2026, 2, 15 );
const CURRENT = { year: 2026, month: 2 };
const FIRST_REPORTED = { year: 2025, month: 10 };

const buildRows = ( ...args: Parameters< typeof buildAllTimeTrafficRows > ) =>
	buildAllTimeTrafficRows( ...args ).rows;

describe( 'buildAllTimeTrafficRows', () => {
	it( 'draws every month of the post life, zeroing the ones the endpoint left out', () => {
		const rows = buildRows( RESPONSE, 'total', TODAY );

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
		const rows = buildRows( RESPONSE, 'total', TODAY, { year: 2025, month: 8, day: 1 } );

		expect( rows[ 1 ].months.slice( 7, 11 ) ).toEqual( [ 'before', 0, 0, 10 ] );
	} );

	it( 'keeps stats from before the publish month', () => {
		const rows = buildRows( RESPONSE, 'total', TODAY, { year: 2026, month: 0, day: 1 } );

		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
	} );

	it( 'keeps the table open through the current month when the endpoint runs behind', () => {
		const rows = buildRows( RESPONSE, 'total', new Date( 2026, 5, 15 ) );

		expect( rows[ 0 ].months[ 5 ] ).toBe( 0 );
		expect( rows[ 0 ].months[ 6 ] ).toBe( 'after' );
	} );

	it( 'reads the per-day averages under the average metric, over the months years reports', () => {
		const rows = buildRows( RESPONSE, 'average', TODAY );

		expect( rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 1, 0, 8 ] );
		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 1, 2 ] );
	} );

	it( 'returns no rows under the average metric without its table', () => {
		expect( buildRows( { years: RESPONSE.years }, 'average', TODAY ) ).toEqual( [] );
	} );

	it( 'carries the year figure the endpoint reports under each metric', () => {
		expect( buildRows( RESPONSE, 'total', TODAY ).map( row => row.total ) ).toEqual( [ 45, 30 ] );
		expect( buildRows( RESPONSE, 'average', TODAY ).map( row => row.total ) ).toEqual( [ 3, 1 ] );
		expect(
			buildRows( { years: { '2026': { months: { '1': 5 } } } }, 'total', TODAY )[ 0 ].total
		).toBeNull();
	} );

	it( 'returns no rows without yearly stats', () => {
		expect( buildAllTimeTrafficRows( undefined, 'total', TODAY ) ).toEqual( {
			rows: [],
			partialMonths: [],
		} );
		expect( buildAllTimeTrafficRows( { years: {} }, 'total', TODAY ) ).toEqual( {
			rows: [],
			partialMonths: [],
		} );
	} );

	describe( 'partial months', () => {
		it( 'marks the current month, which has not finished', () => {
			expect( buildAllTimeTrafficRows( RESPONSE, 'total', TODAY ).partialMonths ).toEqual( [
				CURRENT,
			] );
		} );

		it( 'marks the publish month too when the post went out after the 1st', () => {
			const { partialMonths } = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, {
				...FIRST_REPORTED,
				day: 24,
			} );

			expect( partialMonths ).toEqual( expect.arrayContaining( [ FIRST_REPORTED, CURRENT ] ) );
			expect( partialMonths ).toHaveLength( 2 );
		} );

		it( 'leaves the publish month whole when the post went out on the 1st', () => {
			const { partialMonths } = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, {
				...FIRST_REPORTED,
				day: 1,
			} );

			expect( partialMonths ).toEqual( [ CURRENT ] );
		} );

		it( 'ignores a publish day after the first month with stats', () => {
			const { partialMonths } = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, {
				year: 2026,
				month: 0,
				day: 24,
			} );

			expect( partialMonths ).toEqual( [ CURRENT ] );
		} );

		it( 'leaves the current month whole on the last day of its month', () => {
			const { partialMonths } = buildAllTimeTrafficRows(
				RESPONSE,
				'total',
				new Date( 2026, 2, 31 )
			);

			expect( partialMonths ).toEqual( [] );
		} );

		it( 'marks nothing under the average, which is per day and so comparable', () => {
			expect( buildAllTimeTrafficRows( RESPONSE, 'average', TODAY ).partialMonths ).toEqual( [] );
		} );

		it( 'marks nothing when the current month falls before the post life', () => {
			const response: StatsPostResponse = { years: { '2026': { total: 5, months: { '6': 5 } } } };

			expect( buildAllTimeTrafficRows( response, 'total', TODAY ).partialMonths ).toEqual( [] );
		} );

		it( 'never marks a month between the first and the current', () => {
			const { partialMonths } = buildAllTimeTrafficRows( RESPONSE, 'total', TODAY, {
				...FIRST_REPORTED,
				day: 24,
			} );

			expect( partialMonths ).not.toContainEqual( { year: 2025, month: 11 } );
			expect( partialMonths ).not.toContainEqual( { year: 2026, month: 0 } );
			expect( partialMonths ).not.toContainEqual( { year: 2026, month: 1 } );
		} );
	} );
} );
