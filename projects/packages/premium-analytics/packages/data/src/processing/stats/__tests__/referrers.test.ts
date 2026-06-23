import { sanitizeStatsReferrersResponse } from '..';
import { referrersFixture, referrersSummaryFixture } from '../__fixtures__/referrers';

describe( 'Stats referrers normalizer', () => {
	it( 'normalizes nested referrers', () => {
		const result = sanitizeStatsReferrersResponse( referrersFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						label: 'example.com/path',
						views: 12,
						children: null,
						actionMenu: 1,
					} ),
				],
			} )
		);
	} );

	it( 'normalizes summarized referrers into range data', () => {
		const result = sanitizeStatsReferrersResponse( referrersSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 8474,
				other_views: 0,
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			},
			data: [
				{
					time_interval: '2026-06-22',
					date_start: '2026-06-16T00:00:00+00:00',
					date_end: '2026-06-22T23:59:59+00:00',
					items: [
						expect.objectContaining( {
							label: 'Search Engines',
							views: 4801,
							icon: 'https://example.com/search-engine.png',
							children: [
								expect.objectContaining( {
									label: 'Google Search',
									views: 3936,
									icon: 'https://example.com/google.png',
									children: [
										expect.objectContaining( {
											label: 'google.com',
											views: 3920,
											link: 'http://www.google.com/',
										} ),
										expect.objectContaining( {
											label: 'google.com.hk',
											views: 5,
											link: 'http://www.google.com.hk',
										} ),
									],
								} ),
								expect.objectContaining( {
									label: 'Bing',
									views: 542,
									icon: 'https://example.com/bing.png',
									children: [
										expect.objectContaining( {
											label: 'bing.com',
											views: 523,
											link: 'https://www.bing.com/',
										} ),
										expect.objectContaining( {
											label: 'cn.bing.com',
											views: 2,
											link: 'https://cn.bing.com/',
										} ),
									],
								} ),
							],
							actionMenu: 0,
						} ),
					],
				},
			],
		} );
	} );
} );
