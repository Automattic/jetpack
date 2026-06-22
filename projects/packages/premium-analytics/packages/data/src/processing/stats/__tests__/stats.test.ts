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
	locationsCitySummaryFixture,
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 0,
				dropped_ids: [],
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
							id: 265143,
							label: 'Homepage',
							views: 4157,
							link: 'https://example.com/home-2/',
							public: true,
							type: 'page',
							status: 'publish',
							video_play: false,
							children: null,
						} ),
						expect.objectContaining( {
							id: 0,
							label: 'Home page / Archives',
							views: 1378,
							link: 'https://example.com/',
							type: 'homepage',
							status: null,
							public: false,
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
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

	it( 'normalizes summarized clicks into range data', () => {
		const result = sanitizeStatsClicksResponse( clicksSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_clicks: 1323,
			other_clicks: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 413,
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_search_terms: 0,
				encrypted_search_terms: 31,
				other_search_terms: -34,
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Jetpack Team',
				views: 4166,
				icon: 'https://example.com/avatar.png',
				children: [
					expect.objectContaining( {
						id: 265143,
						label: 'Homepage',
						views: 4157,
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_views: 0,
			other_views: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'New Jersey',
				views: 2979,
				countryCode: 'US',
				countryFull: 'United States',
				region: '021',
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1252,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				region: '030',
			} ),
			expect.objectContaining( {
				label: 'Hungary',
				views: 59,
				countryCode: 'HU',
				countryFull: 'Hungary',
				region: '151',
			} ),
			expect.objectContaining( {
				label: "Côte d'Ivoire",
				views: 2,
				countryCode: 'CI',
				countryFull: 'Côte d’Ivoire',
				region: '002',
			} ),
		] );
	} );

	it( 'normalizes summarized city locations with coordinates', () => {
		const result = sanitizeStatsLocationsResponse( locationsCitySummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_views: 0,
			other_views: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			} )
		);
		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'North Bergen',
				views: 2716,
				countryCode: 'US',
				countryFull: 'United States',
				region: '021',
				coordinates: {
					latitude: '40.804077',
					longitude: '-74.012366',
				},
			} ),
			expect.objectContaining( {
				label: 'Hong Kong',
				views: 1246,
				countryCode: 'HK',
				countryFull: 'Hong Kong SAR China',
				coordinates: {
					latitude: '22.28552',
					longitude: '114.15769',
				},
			} ),
			expect.objectContaining( {
				label: 'London',
				views: 476,
				countryCode: 'GB',
				countryFull: 'United Kingdom',
				coordinates: {
					latitude: '51.50853',
					longitude: '-0.12574',
				},
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
			start_date: '2026-06-16',
			end_date: '2026-06-22',
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
