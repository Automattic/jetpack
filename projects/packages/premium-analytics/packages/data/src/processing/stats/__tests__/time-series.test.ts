import {
	isStatsTimeSeriesPayload,
	sanitizeStatsEmailTimeSeriesResponse,
	sanitizeStatsTimeSeriesResponse,
} from '..';
import {
	emailClicksHourlyTimeSeriesFixture,
	emailClicksTimeSeriesFixture,
	emailOpensHourlyTimeSeriesFixture,
	emailOpensTimeSeriesFixture,
	invalidIsoWeekYearSubscribersFixture,
	invalidWeekSubscribersFixture,
	monthlySubscribersFixture,
	objectRowsTimeSeriesFixture,
	scalarDaysTimeSeriesFixture,
	visitsFixture,
	weeklySubscribersFixture,
	wpcomWeeklySubscribersFixture,
	yearlySubscribersFixture,
} from '../__fixtures__/time-series';

describe( 'Stats time-series normalizer', () => {
	it( 'normalizes visits rows with Premium Analytics date keys', () => {
		const result = sanitizeStatsTimeSeriesResponse( visitsFixture, { period: 'day' } );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				views: 21,
				visitors: 8,
				date_start: '2026-06-15T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00+00:00',
				date_end: '2026-06-15T23:59:59+00:00',
				label: '2026-06-15',
				value: 8,
				views: 8,
				visitors: 3,
				items: [],
			} )
		);
	} );

	it( 'normalizes object rows from top-level data arrays', () => {
		const result = sanitizeStatsTimeSeriesResponse( objectRowsTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				subscribers: 7,
				unsubscribers: 2,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				value: 7,
				subscribers: 7,
				unsubscribers: 2,
			} )
		);
	} );

	it( 'normalizes ISO week rows with date ranges', () => {
		expect( sanitizeStatsTimeSeriesResponse( weeklySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15T00:00:00+00:00',
				date_end: '2026-06-21T23:59:59+00:00',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it( 'normalizes WPCOM YYYYWMMWDD week labels to date ranges', () => {
		expect( sanitizeStatsTimeSeriesResponse( wpcomWeeklySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-29',
				date_start: '2026-06-29T00:00:00+00:00',
				date_end: '2026-07-05T23:59:59+00:00',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it( 'falls back to raw period strings for invalid ISO weeks', () => {
		expect( sanitizeStatsTimeSeriesResponse( invalidWeekSubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-W54',
				date_start: '2026-W54T00:00:00+00:00',
				date_end: '2026-W54T23:59:59+00:00',
				value: 9,
				subscribers: 9,
			} )
		);
		expect(
			sanitizeStatsTimeSeriesResponse( invalidIsoWeekYearSubscribersFixture ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				time_interval: '2025-W53',
				date_start: '2025-W53T00:00:00+00:00',
				date_end: '2025-W53T23:59:59+00:00',
				value: 9,
				subscribers: 9,
			} )
		);
	} );

	it( 'normalizes month and year rows with date-fns boundaries', () => {
		expect( sanitizeStatsTimeSeriesResponse( monthlySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2024-02-01',
				date_start: '2024-02-01T00:00:00+00:00',
				date_end: '2024-02-29T23:59:59+00:00',
				value: 29,
				subscribers: 29,
			} )
		);
		expect( sanitizeStatsTimeSeriesResponse( yearlySubscribersFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2024-01-01',
				date_start: '2024-01-01T00:00:00+00:00',
				date_end: '2024-12-31T23:59:59+00:00',
				value: 366,
				subscribers: 366,
			} )
		);
	} );

	it( 'normalizes scalar days maps into numeric value rows', () => {
		const result = sanitizeStatsTimeSeriesResponse( scalarDaysTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				value: 10,
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15',
				value: 7,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-16',
				value: 3,
			} ),
		] );
	} );

	it( 'normalizes email opens timelines nested under the timeline key', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailOpensTimeSeriesFixture, {
			period: 'day',
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				opens_count: 21,
				date_start: '2026-06-15T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				label: '2026-06-15',
				value: 8,
				opens_count: 8,
				items: [],
			} )
		);
	} );

	it( 'uses the clicks metric as the headline value for click timelines', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailClicksTimeSeriesFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { clicks_count: 11 } ) );
		expect( result.data[ 1 ] ).toEqual(
			expect.objectContaining( { time_interval: '2026-06-16', value: 7, clicks_count: 7 } )
		);
	} );

	it( 'resolves hourly email timelines into distinct per-hour buckets', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailOpensHourlyTimeSeriesFixture, {
			period: 'hour',
		} );

		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15 09:00',
				date_start: '2026-06-15T09:00:00+00:00',
				date_end: '2026-06-15T09:59:59+00:00',
				label: '2026-06-15 09:00',
				value: 3,
				opens_count: 3,
				hour: 9,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-15 10:00',
				date_start: '2026-06-15T10:00:00+00:00',
				value: 5,
				opens_count: 5,
				hour: 10,
			} ),
		] );
		// The hour dimension must not be summed into the metric summary.
		expect( result.summary ).toEqual( expect.objectContaining( { opens_count: 8 } ) );
		expect( result.summary ).not.toHaveProperty( 'hour' );
	} );

	it( 'resolves hourly email clicks timelines into distinct per-hour buckets', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( emailClicksHourlyTimeSeriesFixture, {
			period: 'hour',
		} );

		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-15 09:00',
				date_start: '2026-06-15T09:00:00+00:00',
				date_end: '2026-06-15T09:59:59+00:00',
				value: 4,
				clicks_count: 4,
				hour: 9,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-15 10:00',
				value: 7,
				clicks_count: 7,
				hour: 10,
			} ),
		] );
		expect( result.summary ).toEqual( expect.objectContaining( { clicks_count: 11 } ) );
	} );

	it( 'normalizes hour 0 and string-typed hour values into padded per-hour buckets', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse(
			{
				timeline: {
					unit: 'hour',
					fields: [ 'date', 'opens_count' ],
					data: [
						[ '2026-06-15', '2', 0 ],
						[ '2026-06-15', '4', '23' ],
					],
				},
			},
			{ period: 'hour' }
		);

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( { time_interval: '2026-06-15 00:00', hour: 0, value: 2 } )
		);
		expect( result.data[ 1 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15 23:00',
				date_end: '2026-06-15T23:59:59+00:00',
				hour: '23',
				value: 4,
			} )
		);
	} );

	it( 'returns an empty email time series report when the timeline key is missing', () => {
		const result = sanitizeStatsEmailTimeSeriesResponse( {} );

		expect( result.data ).toEqual( [] );
		expect( result.summary ).toEqual( { date_start: '', date_end: '' } );
	} );

	it( 'detects supported time-series payload shapes', () => {
		expect( isStatsTimeSeriesPayload( visitsFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( scalarDaysTimeSeriesFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( objectRowsTimeSeriesFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( { data: [ { title: 'Not a time series' } ] } ) ).toBe(
			false
		);
	} );
} );
