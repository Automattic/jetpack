import { isStatsTimeSeriesPayload, sanitizeStatsTimeSeriesResponse } from '..';
import {
	invalidIsoWeekYearSubscribersFixture,
	invalidWeekSubscribersFixture,
	monthlySubscribersFixture,
	objectRowsTimeSeriesFixture,
	scalarDaysTimeSeriesFixture,
	visitsFixture,
	weeklySubscribersFixture,
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

	it( 'detects supported time-series payload shapes', () => {
		expect( isStatsTimeSeriesPayload( visitsFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( scalarDaysTimeSeriesFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( objectRowsTimeSeriesFixture ) ).toBe( true );
		expect( isStatsTimeSeriesPayload( { data: [ { title: 'Not a time series' } ] } ) ).toBe(
			false
		);
	} );
} );
