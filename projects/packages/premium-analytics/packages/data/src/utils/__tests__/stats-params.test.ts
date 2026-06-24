/**
 * Internal dependencies
 */
import {
	getStatsPeriodFromInterval,
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
} from '../stats-params';

describe( 'getStatsPeriodFromInterval', () => {
	it.each( [
		[ 'hour', 'hour' ],
		[ 'day', 'day' ],
		[ 'week', 'week' ],
		[ 'month', 'month' ],
		[ 'quarter', 'month' ],
		[ 'year', 'year' ],
		[ undefined, 'day' ],
	] )( 'maps %s to %s', ( interval, period ) => {
		expect( getStatsPeriodFromInterval( interval ) ).toBe( period );
	} );
} );

describe( 'reportParamsToStatsQueryParams', () => {
	it( 'converts report dates into stats date range params', () => {
		expect(
			reportParamsToStatsQueryParams( {
				from: '2026-06-01T00:00:00',
				to: '2026-06-07T23:59:59',
				interval: 'day',
			} )
		).toEqual(
			expect.objectContaining( {
				period: 'day',
				end_date: '2026-06-07',
				start_date: '2026-06-01',
				days: 7,
			} )
		);
	} );

	it( 'resolves offset-bearing dates to the matching calendar day in the site timezone', () => {
		// 23:00 on 2026-06-23 at -08:00 is 2026-06-24 12:30 in +05:30, so both bounds shift forward a day.
		expect(
			reportParamsToStatsQueryParams(
				{
					from: '2026-06-23T23:00:00-08:00',
					to: '2026-06-24T23:00:00-08:00',
					interval: 'day',
				},
				'+05:30'
			)
		).toEqual(
			expect.objectContaining( {
				start_date: '2026-06-24',
				end_date: '2026-06-25',
				days: 2,
			} )
		);
	} );

	it( 'treats the end date as an inclusive calendar day', () => {
		expect(
			reportParamsToStatsQueryParams(
				{
					from: '2026-06-01T00:00:00Z',
					to: '2026-06-01T00:00:00Z',
					interval: 'day',
				},
				'+00:00'
			)
		).toEqual(
			expect.objectContaining( {
				start_date: '2026-06-01',
				end_date: '2026-06-01',
				days: 1,
			} )
		);
	} );

	it( 'passes timezone-naive and date-only inputs through as written', () => {
		expect(
			reportParamsToStatsQueryParams(
				{
					from: '2026-06-01',
					to: '2026-06-07T23:59:59',
					interval: 'day',
				},
				'+05:30'
			)
		).toEqual(
			expect.objectContaining( {
				start_date: '2026-06-01',
				end_date: '2026-06-07',
				days: 7,
			} )
		);
	} );

	it( 'maps the semantic end date to the Stats API date param', () => {
		expect(
			statsQueryParamsToApiParams( {
				period: 'day',
				start_date: '2026-06-01',
				end_date: '2026-06-07',
				days: 7,
			} )
		).toEqual(
			expect.objectContaining( {
				period: 'day',
				date: '2026-06-07',
				start_date: '2026-06-01',
				days: 7,
			} )
		);
	} );

	it( 'falls back to one day for invalid date ranges', () => {
		expect(
			reportParamsToStatsQueryParams( {
				from: '2026-06-07',
				to: '2026-06-01',
			} )
		).toEqual(
			expect.objectContaining( {
				days: 1,
			} )
		);
	} );

	it( 'preserves explicit Stats result limit params', () => {
		expect(
			reportParamsToStatsQueryParams( {
				num: 3,
				max: 25,
			} )
		).toEqual(
			expect.objectContaining( {
				num: 3,
				max: 25,
			} )
		);
	} );

	it( 'does not forward Woo report-only params to Stats endpoints', () => {
		const params = reportParamsToStatsQueryParams( {
			from: '2026-06-01',
			to: '2026-06-01',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-01',
			compare_to: '2026-05-01',
			filters: [ { key: 'product_type', value: [ 'simple' ], compare: 'IN' } ],
			date_type: 'created',
		} );

		expect( params ).not.toHaveProperty( 'filters' );
		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params ).not.toHaveProperty( 'date_type' );
	} );

	it( 'does not forward path-only Stats options to endpoint query params', () => {
		const params = reportParamsToStatsQueryParams( {
			from: '2026-06-01',
			to: '2026-06-01',
			geoMode: 'city',
			utmParams: 'utm_source,utm_campaign',
			deviceProperty: 'browser',
		} );

		expect( params ).not.toHaveProperty( 'geoMode' );
		expect( params ).not.toHaveProperty( 'utmParams' );
		expect( params ).not.toHaveProperty( 'deviceProperty' );
	} );

	it( 'omits empty date params when no dates are provided', () => {
		const params = reportParamsToStatsQueryParams();

		expect( params ).not.toHaveProperty( 'date' );
		expect( params ).not.toHaveProperty( 'end_date' );
		expect( params ).not.toHaveProperty( 'start_date' );
	} );
} );
