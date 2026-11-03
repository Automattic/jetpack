/**
 * Internal dependencies
 */
import { statsHourOfDayQuery } from '../stats-hour-of-day-query';
import type { StatsHourOfDayParams } from '../stats-hour-of-day-query';

function paramsOf( query: ReturnType< typeof statsHourOfDayQuery > ) {
	// The proxy params are only observable at index 5 without running the fetch.
	return ( query.queryKey as unknown[] )[ 5 ] as Record< string, unknown >;
}

describe( 'statsHourOfDayQuery', () => {
	it( 'requests the dashboard range as bare dates', () => {
		const params = paramsOf(
			statsHourOfDayQuery( {
				from: '2026-07-14',
				to: '2026-08-12',
			} as StatsHourOfDayParams )
		);

		expect( params ).toEqual( {
			start_date: '2026-07-14',
			date: '2026-08-12',
		} );
	} );

	it( "sends bare calendar days so its range count matches the endpoint's", () => {
		const params = paramsOf(
			statsHourOfDayQuery( {
				from: '2026-07-14T00:00:00+09:00',
				to: '2026-08-12T23:59:59+09:00',
			} as StatsHourOfDayParams )
		);

		expect( params ).toMatchObject( { start_date: '2026-07-14', date: '2026-08-12' } );
	} );

	it( 'passes a range at the cap through as start_date', () => {
		// 2026-08-12 minus 365 days, inclusive of both ends, is exactly 366 days.
		const params = paramsOf(
			statsHourOfDayQuery( { from: '2025-08-12', to: '2026-08-12' } as StatsHourOfDayParams )
		);

		expect( params.start_date ).toBe( '2025-08-12' );
		expect( params ).not.toHaveProperty( 'days' );
	} );

	it( 'asks for the capped day count one day over the cap', () => {
		const params = paramsOf(
			statsHourOfDayQuery( { from: '2025-08-11', to: '2026-08-12' } as StatsHourOfDayParams )
		);

		expect( params.days ).toBe( 366 );
	} );

	it( 'caps a longer range with days, since the endpoint 400s rather than clamping', () => {
		const params = paramsOf(
			statsHourOfDayQuery( { from: '2019-01-01', to: '2026-08-12' } as StatsHourOfDayParams )
		);

		// `days` counts back from `date`, so start_date would only restate it.
		expect( params.days ).toBe( 366 );
		expect( params ).not.toHaveProperty( 'start_date' );
		expect( params.date ).toBe( '2026-08-12' );
	} );

	it( 'omits start_date when the caller gave no range start', () => {
		const params = paramsOf( statsHourOfDayQuery( { to: '2026-08-12' } as StatsHourOfDayParams ) );

		expect( params ).not.toHaveProperty( 'start_date' );
		expect( params.date ).toBe( '2026-08-12' );
	} );

	it( 'stays disabled without a range end, so it cannot fire an unbounded request', () => {
		expect( statsHourOfDayQuery( { from: '2026-07-14' } as StatsHourOfDayParams ).enabled ).toBe(
			false
		);
		expect(
			statsHourOfDayQuery( {
				from: '2026-07-14',
				to: '2026-08-12',
			} as StatsHourOfDayParams ).enabled
		).toBe( true );
	} );
} );
