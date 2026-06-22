/**
 * Internal dependencies
 */
import {
	combineStatsNormalizedReports,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVideoPlaysResponse,
} from '..';
import {
	fileDownloadsFixture,
	locationsFixture,
	referrersFixture,
	topPostsFixture,
	topPostsSummaryFixture,
	videoPlaysFixture,
} from '../__fixtures__/stats';

describe( 'Stats normalizers', () => {
	it( 'normalizes summarized top posts into range data', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 312,
				dropped_ids: [],
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-30T23:59:59+00:00',
			},
			data: [
				{
					time_interval: '2026-06-30',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-30T23:59:59+00:00',
					items: [
						expect.objectContaining( {
							id: 0,
							label: 'Homepage (Latest posts)',
							views: 182,
							link: null,
							public: false,
							type: 'homepage',
							status: null,
							video_play: false,
							children: [
								expect.objectContaining( {
									label: 'Homepage child attachment',
									link: 'https://example.com/attachment/',
									views: 1,
									type: 'attachment',
								} ),
							],
						} ),
						expect.objectContaining( {
							id: 41,
							label: 'Hello world',
							views: 17,
							link: 'https://example.com/hello/',
							status: 'publish',
							video_play: false,
						} ),
					],
				},
			],
		} );
	} );

	it( 'normalizes top posts into by-date data points', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data ).toEqual( [
			{
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						id: 41,
						label: 'Hello world',
						views: 64,
						children: null,
						link: 'https://example.com/hello/',
					} ),
				],
			},
		] );
	} );

	it( 'combines separately requested summary and by-date data', () => {
		const summaryReport = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );
		const dataReport = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( combineStatsNormalizedReports( summaryReport, dataReport ) ).toEqual( {
			summary: summaryReport.summary,
			data: dataReport.data,
		} );
	} );

	it( 'keeps all by-date buckets when the query has a range end date', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			start_date: '2026-06-15',
			end_date: '2026-06-16',
		} );

		expect( result.data ).toHaveLength( 2 );
		expect( result.data.map( item => item.time_interval ) ).toEqual( [
			'2026-06-15',
			'2026-06-16',
		] );
	} );

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

	it( 'normalizes file downloads with numeric values', () => {
		expect(
			sanitizeStatsFileDownloadsResponse( fileDownloadsFixture, {
				period: 'day',
				end_date: '2026-06-16',
			} ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: '/download.pdf',
				downloads: 5,
				shortLabel: 'download.pdf',
			} )
		);
	} );

	it( 'normalizes location labels with multiple apostrophes', () => {
		const result = sanitizeStatsLocationsResponse( locationsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: "Côte d'Ivoire's",
				views: 7,
			} )
		);
		expect( result.summary ).toEqual( {} );
	} );

	it( 'normalizes secondary video metrics as semantic fields', () => {
		expect(
			sanitizeStatsVideoPlaysResponse( videoPlaysFixture, {
				period: 'day',
				end_date: '2026-06-16',
			} ).data[ 0 ].items[ 0 ]
		).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
				link: 'https://example.com/video/',
			} )
		);
	} );
} );
