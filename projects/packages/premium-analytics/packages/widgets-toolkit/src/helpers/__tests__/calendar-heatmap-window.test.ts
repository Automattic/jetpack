/**
 * Internal dependencies
 */
import { buildDenseDaySeries, resolveCalendarHeatmapWindow } from '../calendar-heatmap-window';

const TODAY = '2026-08-10';

describe( 'resolveCalendarHeatmapWindow', () => {
	describe( 'minDays — the posting activity floor', () => {
		it( 'extends a short range backwards to the floor', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2026-08-04', to: '2026-08-10' },
					{ minDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2025-08-10', endDate: '2026-08-10' } );
		} );

		it( 'leaves a range that already reaches further back alone', () => {
			expect(
				resolveCalendarHeatmapWindow(
					{ from: '2021-01-01', to: '2026-08-10' },
					{ minDays: 366 },
					TODAY
				)
			).toEqual( { startDate: '2021-01-01', endDate: '2026-08-10' } );
		} );
	} );

	describe( 'maxDays — the traffic views cap', () => {
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

	it( 'applies both bounds together', () => {
		const bounds = { minDays: 30, maxDays: 60 };

		expect(
			resolveCalendarHeatmapWindow( { from: '2026-08-08', to: '2026-08-10' }, bounds, TODAY )
		).toEqual( { startDate: '2026-07-12', endDate: '2026-08-10' } );
		expect(
			resolveCalendarHeatmapWindow( { from: '2020-01-01', to: '2026-08-10' }, bounds, TODAY )
		).toEqual( { startDate: '2026-06-12', endDate: '2026-08-10' } );
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

	it( 'accepts a Map lookup', () => {
		expect(
			buildDenseDaySeries( new Map( [ [ '2026-08-01', 7 ] ] ), '2026-08-01', '2026-08-01' )
		).toEqual( [ { dateString: '2026-08-01', value: 7 } ] );
	} );

	it( 'spans a DST boundary without dropping or repeating a day', () => {
		const series = buildDenseDaySeries( {}, '2026-03-28', '2026-03-30' );

		expect( series.map( point => point.dateString ) ).toEqual( [
			'2026-03-28',
			'2026-03-29',
			'2026-03-30',
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
