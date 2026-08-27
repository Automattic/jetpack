/**
 * Internal dependencies
 */
import { buildViewsOverYears } from '../build-views-over-years';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';

/**
 * A monthly `stats/visits` response, as the shared time-series sanitizer leaves
 * it: one bucket per month, stamped with the month's own bounds.
 *
 * @param months - `[ 'yyyy-MM', views ]` pairs, oldest first.
 * @return The report shape the widget reads.
 */
function report( months: [ string, number ][] ): StatsVisitsResponse {
	return {
		summary: {},
		data: months.map( ( [ month, views ] ) => ( {
			time_interval: `${ month }-01`,
			date_start: `${ month }-01T00:00:00`,
			date_end: `${ month }-28T23:59:59`,
			label: `${ month }-01`,
			value: views,
			views,
			items: [],
		} ) ),
	} as unknown as StatsVisitsResponse;
}

// Mid-month, so the current month's average has fewer days than the calendar
// gives it and a wrong denominator is visible.
const TODAY = new Date( 2026, 2, 10 );

describe( 'buildViewsOverYears', () => {
	it( 'returns one row per year, newest first', () => {
		const rows = buildViewsOverYears(
			report( [
				[ '2024-11', 10 ],
				[ '2025-01', 20 ],
				[ '2026-01', 30 ],
			] ),
			'total',
			TODAY
		);

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025, 2024 ] );
	} );

	it( 'starts at the first month with views and blanks everything before it', () => {
		const rows = buildViewsOverYears(
			report( [
				// The request reaches back to a fixed floor, so the response opens
				// with months that predate the site.
				[ '2023-01', 0 ],
				[ '2023-12', 0 ],
				[ '2024-03', 5 ],
				[ '2024-04', 0 ],
			] ),
			'total',
			TODAY
		);

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025, 2024 ] );

		const [ , , first ] = rows;
		// January and February predate the site; March is its first month, and
		// April is a measured zero rather than a blank.
		expect( first.months.slice( 0, 5 ) ).toEqual( [ null, null, 5, 0, 0 ] );
	} );

	it( 'blanks the months that have not happened yet', () => {
		const [ current ] = buildViewsOverYears( report( [ [ '2026-01', 31 ] ] ), 'total', TODAY );

		expect( current.months.slice( 0, 3 ) ).toEqual( [ 31, 0, 0 ] );
		expect( current.months.slice( 3 ) ).toEqual( Array( 9 ).fill( null ) );
	} );

	it( 'returns no rows when the site has never had a view', () => {
		expect(
			buildViewsOverYears(
				report( [
					[ '2025-01', 0 ],
					[ '2025-02', 0 ],
				] ),
				'total',
				TODAY
			)
		).toEqual( [] );
	} );

	it( 'returns no rows for a missing response', () => {
		expect( buildViewsOverYears( undefined, 'total', TODAY ) ).toEqual( [] );
	} );

	it( 'totals each year in the total metric', () => {
		const [ current ] = buildViewsOverYears(
			report( [
				[ '2026-01', 31 ],
				[ '2026-02', 28 ],
				[ '2026-03', 10 ],
			] ),
			'total',
			TODAY
		);

		expect( current.total ).toBe( 69 );
	} );

	it( 'averages a month over its own days, capping the current month at today', () => {
		const [ current ] = buildViewsOverYears(
			report( [
				[ '2026-01', 310 ],
				[ '2026-02', 280 ],
				[ '2026-03', 100 ],
			] ),
			'average',
			TODAY
		);

		// 310/31, 280/28, and March over the ten days that have happened — not 31.
		expect( current.months.slice( 0, 3 ) ).toEqual( [ 10, 10, 10 ] );
	} );

	it( "averages a year over the year's own days, not over its monthly averages", () => {
		const [ current ] = buildViewsOverYears(
			report( [
				[ '2026-01', 3100 ],
				[ '2026-02', 280 ],
				[ '2026-03', 100 ],
			] ),
			'average',
			TODAY
		);

		// 3480 views over 31 + 28 + 10 days. A mean of the monthly averages
		// (100, 10, 10) would report 40.
		expect( current.total ).toBe( Math.round( 3480 / 69 ) );
	} );

	it( 'reads a leap February as 29 days', () => {
		const [ current ] = buildViewsOverYears(
			report( [ [ '2024-02', 290 ] ] ),
			'average',
			new Date( 2024, 5, 15 )
		);

		expect( current.months[ 1 ] ).toBe( 10 );
	} );

	it( 'ignores buckets whose period cannot be read', () => {
		const malformed = report( [ [ '2026-01', 10 ] ] );
		malformed.data.push( {
			date_start: 'not-a-date',
			time_interval: 'not-a-date',
			views: 999,
		} as unknown as ( typeof malformed.data )[ number ] );

		const [ current ] = buildViewsOverYears( malformed, 'total', TODAY );

		expect( current.total ).toBe( 10 );
	} );
} );
