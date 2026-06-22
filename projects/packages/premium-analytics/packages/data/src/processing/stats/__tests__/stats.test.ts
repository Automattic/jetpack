/**
 * Internal dependencies
 */
import {
	combineStatsNormalizedReports,
	sanitizeStatsClicksResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVideoPlaysResponse,
} from '..';
import {
	clicksSummaryFixture,
	fileDownloadsFixture,
	fileDownloadsSummaryFixture,
	locationsFixture,
	locationsSummaryFixture,
	referrersFixture,
	referrersSummaryFixture,
	searchTermsSummaryFixture,
	topAuthorsSummaryFixture,
	topPostsFixture,
	topPostsSummaryFixture,
	videoPlaysFixture,
	videoPlaysSummaryFixture,
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
				total_views: 5411,
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
							id: 265143,
							label: 'Homepage',
							views: 4148,
							link: 'https://example.com/home-2/',
							public: true,
							type: 'page',
							status: 'publish',
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
							id: 242307,
							label: 'Jetpack Backup',
							views: 1263,
							link: 'https://example.com/upgrade/backup/',
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

	it( 'normalizes summarized referrers into range data', () => {
		const result = sanitizeStatsReferrersResponse( referrersSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 4786,
				other_views: 0,
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
							label: 'Search Engines',
							views: 4786,
							icon: 'https://example.com/search-engine.png',
							children: [
								expect.objectContaining( {
									label: 'Google Search',
									views: 3924,
									icon: 'https://example.com/google.png',
									children: [
										expect.objectContaining( {
											label: 'google.com',
											views: 3908,
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

	it( 'normalizes summarized clicks into range data', () => {
		const result = sanitizeStatsClicksResponse( clicksSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_clicks: 412,
			other_clicks: 0,
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-30T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-30',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 412,
						link: null,
						icon: 'https://example.com/blavatar.png',
						children: [
							expect.objectContaining( {
								label: '/plugins/jetpack-search',
								views: 100,
								link: 'https://wordpress.org/plugins/jetpack-search',
							} ),
							expect.objectContaining( {
								label: '/plugins/jetpack-boost/',
								views: 32,
								link: 'https://wordpress.org/plugins/jetpack-boost/',
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'normalizes summarized search terms into range data', () => {
		const result = sanitizeStatsSearchTermsResponse( searchTermsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_search_terms: 0,
				encrypted_search_terms: 30,
				other_search_terms: -33,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'delete revisions for wordpress',
				views: 1,
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

	it( 'normalizes summarized file downloads into range data', () => {
		const result = sanitizeStatsFileDownloadsResponse( fileDownloadsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_downloads: 8,
				other_downloads: 0,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: '/guide.pdf',
				downloads: 8,
				shortLabel: 'guide.pdf',
				link: 'https://example.com/guide.pdf',
			} )
		);
	} );

	it( 'normalizes summarized top authors into range data', () => {
		const result = sanitizeStatsTopAuthorsResponse( topAuthorsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_views: 4160,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Jetpack Team',
				views: 4160,
				icon: 'https://example.com/avatar.png',
				children: [
					expect.objectContaining( {
						id: 265143,
						label: 'Homepage',
						views: 4151,
						link: 'https://example.com/?p=265143',
					} ),
					expect.objectContaining( {
						id: 345724,
						label: 'What’s new in Jetpack: June 2025 Update',
						views: 3,
						link: 'https://example.com/?p=345724',
					} ),
				],
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
				region: '002',
			} )
		);
		expect( result.summary ).toEqual( {} );
	} );

	it( 'normalizes summarized locations into range data', () => {
		const result = sanitizeStatsLocationsResponse( locationsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_views: 0,
			other_views: 0,
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'Hungary',
				views: 59,
				countryCode: 'HU',
				countryFull: undefined,
				region: undefined,
			} ),
			expect.objectContaining( {
				label: 'Trinidad & Tobago',
				views: 33,
				countryCode: 'TT',
			} ),
			expect.objectContaining( {
				label: "Côte d'Ivoire",
				views: 2,
				countryCode: 'CI',
			} ),
		] );
	} );

	it( 'normalizes video plays with the default plays shape', () => {
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
				link: 'https://example.com/video/',
			} )
		);
	} );

	it( 'normalizes summarized video plays into range data', () => {
		const result = sanitizeStatsVideoPlaysResponse( videoPlaysSummaryFixture, {
			period: 'day',
			start_date: '2026-06-01',
			end_date: '2026-06-30',
			summarize: true,
			complete_stats: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total: {
					views: '11',
					impressions: '42',
					watch_time: '128.5',
				},
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 12,
				label: 'Launch video',
				plays: 11,
				impressions: 42,
				watch_time: 128.5,
				retention_rate: 61.25,
			} )
		);
	} );
} );
