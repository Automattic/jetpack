import { sanitizeStatsWordAdsEarningsResponse, sanitizeStatsWordAdsStatsResponse } from '..';
import {
	wordAdsEarningsEmptyFixture,
	wordAdsEarningsFixture,
	wordAdsStatsEmptyFixture,
	wordAdsStatsFixture,
} from '../__fixtures__/wordads';

describe( 'Stats WordAds normalizers', () => {
	it( 'normalizes raw WordAds stats matrix rows into a time-series report', () => {
		const result = sanitizeStatsWordAdsStatsResponse( wordAdsStatsFixture, {
			period: 'month',
			date: '2026-06-30',
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				impressions: 2000,
				revenue: 9.75,
				cpm: 4.875,
				date_start: '2026-05-01T00:00:00',
				date_end: '2026-06-30T23:59:59',
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-05-01',
				date_start: '2026-05-01T00:00:00',
				date_end: '2026-05-31T23:59:59',
				label: '2026-05-01',
				value: 1200,
				impressions: 1200,
				revenue: 6.5,
				cpm: 5.42,
				items: [],
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00',
				date_end: '2026-06-30T23:59:59',
				value: 800,
				impressions: 800,
				revenue: 3.25,
				cpm: 4.06,
			} ),
		] );
	} );

	it( 'nulls CPM for a bucket with no impressions and keeps a real zero CPM', () => {
		const result = sanitizeStatsWordAdsStatsResponse( {
			unit: 'month',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [
				[ '2026-05', 0, 0, 0 ],
				[ '2026-06', 800, 0, 0 ],
			],
		} );

		expect( result.data.map( row => row.cpm ) ).toEqual( [ null, 0 ] );
		expect( result.summary.cpm ).toBe( 0 );
	} );

	it( 'nulls the CPM headline when the whole range has no impressions', () => {
		const result = sanitizeStatsWordAdsStatsResponse( {
			unit: 'day',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [ [ '2026-06-01', 0, 0, 0 ] ],
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( { impressions: 0, revenue: 0, cpm: null } )
		);
	} );

	// A day's numbers arrive once it ends in UTC, so the current UTC day is zeros
	// that are not readings; east of UTC that is still the site's yesterday.
	describe( 'uncounted days', () => {
		beforeEach( () => {
			jest.useFakeTimers().setSystemTime( new Date( '2026-06-02T15:00:00Z' ) );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'nulls all three fields from the current UTC day on, flags them pending, and totals the rest', () => {
			const result = sanitizeStatsWordAdsStatsResponse(
				{
					unit: 'day',
					fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
					data: [
						[ '2026-06-01', 800, 3.25, 4.06 ],
						[ '2026-06-02', 0, 0, 0 ],
						// The site's today, east of UTC.
						[ '2026-06-03', 0, 0, 0 ],
					],
				},
				{ period: 'day', date: '2026-06-03' }
			);

			expect( result.data.map( row => row.pending ) ).toEqual( [ undefined, true, true ] );
			expect( result.data[ 1 ] ).toEqual(
				expect.objectContaining( { impressions: null, revenue: null, cpm: null } )
			);
			expect( result.summary ).toEqual(
				expect.objectContaining( { impressions: 800, revenue: 3.25, cpm: 4.0625 } )
			);
		} );

		it.each( [
			[ 'a day range ending before the current UTC day', 'day', '2026-06-01' ],
			[
				'a month bucket that includes today, which is partial rather than empty',
				'month',
				'2026-06',
			],
		] )( 'leaves %s alone', ( _case, unit, period ) => {
			const result = sanitizeStatsWordAdsStatsResponse(
				{
					unit,
					fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
					data: [ [ period, 0, 0, 0 ] ],
				},
				{ period: unit }
			);

			expect( result.data[ 0 ] ).toEqual(
				expect.objectContaining( { impressions: 0, revenue: 0 } )
			);
			expect( result.data[ 0 ].pending ).toBeUndefined();
		} );
	} );

	it( 'returns an empty report for empty WordAds stats payloads', () => {
		expect( sanitizeStatsWordAdsStatsResponse( wordAdsStatsEmptyFixture ) ).toEqual( {
			summary: {
				date_start: '',
				date_end: '',
			},
			data: [],
		} );
	} );

	it( 'normalizes raw WordAds earnings payloads while preserving breakdown fields', () => {
		expect( sanitizeStatsWordAdsEarningsResponse( wordAdsEarningsFixture ) ).toEqual( {
			total_earnings: 25.75,
			total_amount_owed: 7.25,
			wordads: {
				'2026-05': {
					amount: 6.5,
					pageviews: 1200,
					status: 1,
				},
				'2026-06': {
					amount: 3.25,
					pageviews: 800,
					status: 0,
				},
			},
			sponsored: {
				'2026-06': {
					amount: 16,
					pageviews: 450,
					status: 3,
				},
			},
			adjustment: {
				'2026-06': {
					amount: 0,
					pageviews: 0,
					status: 4,
				},
			},
		} );
	} );

	it( 'keeps a non-numeric or absent Ads Served value absent rather than zero', () => {
		const { wordads, adjustment } = sanitizeStatsWordAdsEarningsResponse( {
			earnings: {
				wordads: { '2012-03': { amount: '1.00', pageviews: 'N/A', status: 1 } },
				adjustment: { '2026-06': { amount: '-2.50', status: 1 } },
			},
		} );

		expect( wordads[ '2012-03' ].pageviews ).toBeUndefined();
		expect( adjustment[ '2026-06' ].pageviews ).toBeUndefined();
	} );

	it( 'returns numeric defaults and empty breakdowns for missing earnings fields', () => {
		expect( sanitizeStatsWordAdsEarningsResponse( wordAdsEarningsEmptyFixture ) ).toEqual( {
			total_earnings: 0,
			total_amount_owed: 0,
			wordads: {},
			sponsored: {},
			adjustment: {},
		} );
	} );
} );
