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
				date_start: '2026-05-01T00:00:00+00:00',
				date_end: '2026-06-30T23:59:59+00:00',
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-05-01',
				date_start: '2026-05-01T00:00:00+00:00',
				date_end: '2026-05-31T23:59:59+00:00',
				label: '2026-05-01',
				value: 1200,
				impressions: 1200,
				revenue: 6.5,
				cpm: 5.42,
				items: [],
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-30T23:59:59+00:00',
				value: 800,
				impressions: 800,
				revenue: 3.25,
				cpm: 4.06,
			} ),
		] );
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

	it( 'returns numeric defaults and empty breakdowns for missing earnings fields', () => {
		expect( sanitizeStatsWordAdsEarningsResponse( wordAdsEarningsEmptyFixture ) ).toEqual( {
			total_earnings: 0,
			total_amount_owed: 0,
			wordads: {},
			sponsored: {},
			adjustment: {},
		} );
		expect( sanitizeStatsWordAdsEarningsResponse( {} ) ).toEqual( {
			total_earnings: 0,
			total_amount_owed: 0,
			wordads: {},
			sponsored: {},
			adjustment: {},
		} );
	} );
} );
