/**
 * Internal dependencies
 */
import {
	getPeriodsBetweenInclusive,
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

describe( 'getPeriodsBetweenInclusive', () => {
	it.each( [
		[ 'day', '2026-06-01', '2026-06-30', 30 ],
		[ 'week', '2026-06-01', '2026-06-28', 4 ],
		[ 'month', '2026-01-15', '2026-06-15', 6 ],
		[ 'year', '2024-03-01', '2026-03-01', 3 ],
	] as const )( 'counts %s buckets inclusive of both ends', ( period, from, to, expected ) => {
		expect( getPeriodsBetweenInclusive( period, from, to ) ).toBe( expected );
	} );

	it.each( [
		[ 'day', '2026-06-01T00:00:00.000-07:00', '2026-06-30T23:59:59.999-07:00', 30 ],
		[ 'week', '2026-06-01T00:00:00.000-07:00', '2026-06-28T23:59:59.999-07:00', 4 ],
		[ 'month', '2026-01-15T00:00:00.000-07:00', '2026-06-15T23:59:59.999-07:00', 6 ],
		[ 'year', '2024-03-01T00:00:00.000-07:00', '2026-03-01T23:59:59.999-07:00', 3 ],
	] as const )(
		'counts %s buckets from an offset-bearing range exactly as from a bare one',
		( period, from, to, expected ) => {
			expect( getPeriodsBetweenInclusive( period, from, to ) ).toBe( expected );
		}
	);

	// Hourly is the one granularity finer than a calendar day, so it counts the
	// instants rather than the days they fall on. A range ending on the hour is
	// not a bucket longer than one ending a millisecond before it, so the span
	// rounds up rather than gaining a fixed `+ 1`.
	it.each( [
		[ '2026-06-01T00:00:00.000-07:00', '2026-06-01T23:59:59.999-07:00', 24 ],
		[ '2026-06-01T09:00:00.000-07:00', '2026-06-02T08:59:59.999-07:00', 24 ],
		[ '2026-06-01T00:00:00.000-07:00', '2026-06-02T23:59:59.999-07:00', 48 ],
		[ '2026-06-01T09:00:00.000-07:00', '2026-06-01T09:30:00.000-07:00', 1 ],
		[ '2026-06-01T00:00:00.000-07:00', '2026-06-02T00:00:00.000-07:00', 24 ],
		[ '2026-06-01', '2026-06-02', 24 ],
		[ '2026-06-01T09:00:00.000-07:00', '2026-06-01T09:00:00.000-07:00', 1 ],
	] )( 'counts the hour buckets from %s to %s', ( from, to, expected ) => {
		expect( getPeriodsBetweenInclusive( 'hour', from, to ) ).toBe( expected );
	} );

	it( 'reads the site-local calendar day, not the UTC day, at a day boundary', () => {
		// 23:00 on 2026-06-30 at -07:00 is already 2026-07-01 in UTC. Counting
		// off the UTC day would report an extra bucket on every negative-offset
		// site whose range ends late in the evening.
		expect(
			getPeriodsBetweenInclusive(
				'day',
				'2026-06-01T00:00:00.000-07:00',
				'2026-06-30T23:00:00.000-07:00'
			)
		).toBe( 30 );
		expect(
			getPeriodsBetweenInclusive(
				'month',
				'2026-06-01T00:00:00.000-07:00',
				'2026-06-30T23:00:00.000-07:00'
			)
		).toBe( 1 );
	} );

	it( 'falls back to one bucket for an inverted range', () => {
		expect( getPeriodsBetweenInclusive( 'month', '2026-06-01', '2026-01-01' ) ).toBe( 1 );
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
				end_date: '2026-06-07T23:59:59',
				start_date: '2026-06-01T00:00:00',
				days: 7,
			} )
		);
	} );

	it( 'passes the offset-bearing date through untrimmed, still counting days correctly', () => {
		expect(
			reportParamsToStatsQueryParams( {
				from: '2026-06-01T00:00:00.000-07:00',
				to: '2026-06-07T23:59:59.000-07:00',
				interval: 'day',
			} )
		).toEqual(
			expect.objectContaining( {
				period: 'day',
				end_date: '2026-06-07T23:59:59.000-07:00',
				start_date: '2026-06-01T00:00:00.000-07:00',
				days: 7,
			} )
		);
	} );

	it( 'keeps the time of day on an hourly range, still counting whole days', () => {
		// The `last-24-hours` shape: an hourly range whose ends are mid-day, not
		// midnight. The time survives to the wire (the endpoint resolves it),
		// while `days` stays a calendar-day count for the bucket math.
		expect(
			reportParamsToStatsQueryParams( {
				from: '2026-06-14T09:00:00.000-04:00',
				to: '2026-06-15T08:59:59.999-04:00',
				interval: 'hour',
			} )
		).toEqual(
			expect.objectContaining( {
				period: 'hour',
				start_date: '2026-06-14T09:00:00.000-04:00',
				end_date: '2026-06-15T08:59:59.999-04:00',
				days: 2,
			} )
		);
	} );

	it( 'maps the semantic end date to the Stats API date param', () => {
		const apiParams = statsQueryParamsToApiParams( {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-07',
			days: 7,
		} );

		expect( apiParams ).toEqual(
			expect.objectContaining( {
				period: 'day',
				date: '2026-06-07',
				start_date: '2026-06-01',
				days: 7,
			} )
		);
		// The semantic end_date must not survive alongside the API's date param
		// — endpoints read `date`, and a stray end_date would leak into query
		// keys and request URLs.
		expect( apiParams ).not.toHaveProperty( 'end_date' );
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

	it( 'forwards the Stats archives handling option', () => {
		expect( reportParamsToStatsQueryParams( { skip_archives: 1 } ) ).toEqual(
			expect.objectContaining( {
				skip_archives: 1,
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

	it( 'does not forward unknown params to Stats endpoints', () => {
		const params = reportParamsToStatsQueryParams( {
			from: '2026-06-01',
			to: '2026-06-01',
			unknown_param: 'leak',
		} );

		expect( params ).not.toHaveProperty( 'unknown_param' );
	} );

	it( 'omits empty date params when no dates are provided', () => {
		const params = reportParamsToStatsQueryParams();

		expect( params ).not.toHaveProperty( 'date' );
		expect( params ).not.toHaveProperty( 'end_date' );
		expect( params ).not.toHaveProperty( 'start_date' );
	} );
} );
