/**
 * Internal dependencies
 */
import {
	buildDenseDaySeries,
	resolveCalendarHeatmapGridStart,
	resolveCalendarHeatmapWindow,
} from '../calendar-heatmap-window';

const TODAY = '2026-08-10';

describe( 'resolveCalendarHeatmapWindow', () => {
	describe( 'maxDays — the shared cap', () => {
		it( 'caps an all-time range to the most recent year', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2021-01-01', to: '2026-08-10' },
					{ maxDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2025-08-10', endDate: '2026-08-10' } );
		} );

		it( 'keeps a selected leap year whole', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2024-01-01', to: '2024-12-31' },
					{ maxDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2024-01-01', endDate: '2024-12-31' } );
		} );

		it( 'keeps a selected common year whole', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2025-01-01', to: '2025-12-31' },
					{ maxDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2025-01-01', endDate: '2025-12-31' } );
		} );

		it( 'does not reach back past the start of a partial current year', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2026-01-01', to: '2026-08-10' },
					{ maxDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2026-01-01', endDate: '2026-08-10' } );
		} );

		it( 'never extends a short range', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2026-08-01', to: '2026-08-10' },
					{ maxDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2026-08-01', endDate: '2026-08-10' } );
		} );
	} );

	it( 'reads only the calendar day from an offset-bearing timestamp', () => {
		expect(
			resolveCalendarHeatmapWindow(
				{ from: '2026-01-01T00:00:00+08:00', to: '2026-08-10T23:59:59+08:00' },
				{ maxDays: 366 },
				TODAY
			)
		).toEqual( { startDate: '2026-01-01', endDate: '2026-08-10' } );
	} );

	it( 'falls back to today when the range has no end', () => {
		expect( resolveCalendarHeatmapWindow( { from: '2026-08-01' }, {}, TODAY ) ).toEqual( {
			startDate: '2026-08-01',
			endDate: TODAY,
		} );
	} );

	it( 'uses the supplied end when the range has no start', () => {
		expect( resolveCalendarHeatmapWindow( { to: '2026-03-01' }, {}, TODAY ) ).toEqual( {
			startDate: '2026-03-01',
			endDate: '2026-03-01',
		} );
	} );

	it( 'collapses to the end date when the range is inverted and unbounded', () => {
		expect(
			resolveCalendarHeatmapWindow( { from: '2026-09-01', to: '2026-08-10' }, {}, TODAY )
		).toEqual( { startDate: '2026-08-10', endDate: '2026-08-10' } );
	} );
} );

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
