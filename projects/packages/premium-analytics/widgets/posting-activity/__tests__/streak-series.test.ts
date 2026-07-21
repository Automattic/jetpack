/**
 * Internal dependencies
 */
import { buildStreakSeries } from '../streak-series';

describe( 'buildStreakSeries', () => {
	it( 'fills every day across the window, with null for days that have no posts', () => {
		const series = buildStreakSeries(
			{ '2026-01-01': 3, '2026-01-03': 1 },
			'2026-01-01',
			'2026-01-04'
		);

		expect( series ).toEqual( [
			{ dateString: '2026-01-01', value: 3 },
			{ dateString: '2026-01-02', value: null },
			{ dateString: '2026-01-03', value: 1 },
			{ dateString: '2026-01-04', value: null },
		] );
	} );

	it( 'keeps a real 0 distinct from a missing day', () => {
		const series = buildStreakSeries( { '2026-01-02': 0 }, '2026-01-01', '2026-01-02' );

		expect( series ).toEqual( [
			{ dateString: '2026-01-01', value: null },
			{ dateString: '2026-01-02', value: 0 },
		] );
	} );

	it( 'spans a full year (inclusive) of daily points', () => {
		const series = buildStreakSeries( { '2026-07-15': 2 }, '2025-07-15', '2026-07-15' );

		expect( series ).toHaveLength( 366 );
		expect( series[ 0 ].dateString ).toBe( '2025-07-15' );
		expect( series[ series.length - 1 ] ).toEqual( { dateString: '2026-07-15', value: 2 } );
	} );

	it( 'derives the date part from ISO datetime bounds', () => {
		const series = buildStreakSeries(
			{ '2026-01-01': 5 },
			'2026-01-01T00:00:00Z',
			'2026-01-02T23:59:59Z'
		);

		expect( series ).toEqual( [
			{ dateString: '2026-01-01', value: 5 },
			{ dateString: '2026-01-02', value: null },
		] );
	} );

	it( 'falls back to the raw entries when the range is missing', () => {
		const series = buildStreakSeries( { '2026-01-01': 3, '2026-01-05': 1 } );

		expect( series ).toEqual( [
			{ dateString: '2026-01-01', value: 3 },
			{ dateString: '2026-01-05', value: 1 },
		] );
	} );

	it( 'falls back to the raw entries when the range is inverted', () => {
		const series = buildStreakSeries( { '2026-01-05': 1 }, '2026-01-05', '2026-01-01' );

		expect( series ).toEqual( [ { dateString: '2026-01-05', value: 1 } ] );
	} );
} );
