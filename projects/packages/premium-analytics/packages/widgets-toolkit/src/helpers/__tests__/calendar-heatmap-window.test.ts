/**
 * Internal dependencies
 */
import { buildDenseDaySeries, resolveCalendarHeatmapGridStart } from '../calendar-heatmap-window';

const TODAY = '2026-08-10';

describe( 'buildDenseDaySeries', () => {
	it( 'emits one point per day of the window', () => {
		expect( buildDenseDaySeries( { '2026-08-02': 5 }, '2026-08-01', '2026-08-03' ) ).toEqual( [
			{ dateString: '2026-08-01', value: null },
			{ dateString: '2026-08-02', value: 5 },
			{ dateString: '2026-08-03', value: null },
		] );
	} );

	it( 'preserves a nulled entry rather than treating it as absent', () => {
		expect( buildDenseDaySeries( { '2026-08-01': null }, '2026-08-01', '2026-08-01' ) ).toEqual( [
			{ dateString: '2026-08-01', value: null },
		] );
	} );

	it( 'keeps a real zero distinct from a missing day', () => {
		expect( buildDenseDaySeries( { '2026-08-02': 0 }, '2026-08-01', '2026-08-02' ) ).toEqual( [
			{ dateString: '2026-08-01', value: null },
			{ dateString: '2026-08-02', value: 0 },
		] );
	} );

	it( 'accepts a Map lookup', () => {
		expect(
			buildDenseDaySeries( new Map( [ [ '2026-08-01', 7 ] ] ), '2026-08-01', '2026-08-01' )
		).toEqual( [ { dateString: '2026-08-01', value: 7 } ] );
	} );

	it( 'spans a DST boundary without dropping or repeating a day', () => {
		const previousTimezone = Reflect.get( process.env, 'TZ' );
		Reflect.set( process.env, 'TZ', 'Europe/London' );

		try {
			const series = buildDenseDaySeries( {}, '2026-01-01', '2026-12-31' );
			const days = series.map( point => point.dateString );

			expect( series ).toHaveLength( 365 );
			expect( days[ 0 ] ).toBe( '2026-01-01' );
			expect( days[ days.length - 1 ] ).toBe( '2026-12-31' );
			expect( new Set( days ) ).toHaveProperty( 'size', 365 );
		} finally {
			if ( previousTimezone === undefined ) {
				Reflect.deleteProperty( process.env, 'TZ' );
			} else {
				Reflect.set( process.env, 'TZ', previousTimezone );
			}
		}
	} );

	it( 'derives the date part from timestamp bounds', () => {
		expect(
			buildDenseDaySeries( { '2026-01-01': 5 }, '2026-01-01T00:00:00Z', '2026-01-02T23:59:59Z' )
		).toEqual( [
			{ dateString: '2026-01-01', value: 5 },
			{ dateString: '2026-01-02', value: null },
		] );
	} );

	it( 'falls back to the lookup entries when the window is missing or inverted', () => {
		expect( buildDenseDaySeries( { '2026-08-02': 5 } ) ).toEqual( [
			{ dateString: '2026-08-02', value: 5 },
		] );
		expect( buildDenseDaySeries( { '2026-08-02': 5 }, '2026-08-05', '2026-08-01' ) ).toEqual( [
			{ dateString: '2026-08-02', value: 5 },
		] );
	} );
} );

describe( 'resolveCalendarHeatmapGridStart', () => {
	// The current year is selected as January through today, so for most of the
	// year it has fewer weeks than a wide tile can draw.
	it( 'opens the grid back far enough to fill the tile', () => {
		expect( resolveCalendarHeatmapGridStart( TODAY, 53 ) ).toBe( '2025-08-11' );
	} );

	it( 'lands on the same weekday, so the span is a whole number of columns', () => {
		// 2026-08-10 is a Monday; every result must be one too.
		expect( resolveCalendarHeatmapGridStart( TODAY, 1 ) ).toBe( TODAY );
		expect( resolveCalendarHeatmapGridStart( TODAY, 2 ) ).toBe( '2026-08-03' );
		expect( resolveCalendarHeatmapGridStart( TODAY, 3 ) ).toBe( '2026-07-27' );
	} );

	it( 'crosses a leap day without drifting', () => {
		expect( resolveCalendarHeatmapGridStart( '2024-03-04', 2 ) ).toBe( '2024-02-26' );
	} );

	// The caller passes a measured column count, so a collapsed tile reports zero
	// and must not be turned into a one-column grid.
	it.each( [ 0, -1, 0.5, NaN, Infinity ] )( 'sizes nothing from %p columns', columns => {
		expect( resolveCalendarHeatmapGridStart( TODAY, columns ) ).toBeUndefined();
	} );

	it( 'sizes nothing from a date it cannot parse', () => {
		expect( resolveCalendarHeatmapGridStart( 'not-a-date', 53 ) ).toBeUndefined();
	} );
} );
