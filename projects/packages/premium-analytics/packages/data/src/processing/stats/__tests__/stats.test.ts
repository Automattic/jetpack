/**
 * Internal dependencies
 */
import {
	sanitizeStatsCommentFollowersResponse,
	sanitizeStatsCommentsResponse,
	sanitizeStatsDevicesResponse,
	sanitizeStatsEmailBreakdownResponse,
	sanitizeStatsEmailSummaryResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsFollowersResponse,
	sanitizeStatsGenericListResponse,
	sanitizeStatsPublicizeResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsTagsResponse,
	sanitizeStatsTimeSeriesResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsUtmResponse,
	sanitizeStatsVisitsResponse,
} from '..';
import {
	devicesFixture,
	devicesTopValuesFixture,
	commentFollowersFixture,
	commentsFixture,
	emailClicksCountryBreakdownFixture,
	emailClicksTimeSeriesFixture,
	emailOpensBreakdownFixture,
	emailOpensTimeSeriesFixture,
	emailSummaryFixture,
	fileDownloadsFixture,
	followersFixture,
	genericListFixture,
	publicizeFixture,
	referrersFixture,
	scalarDaysTimeSeriesFixture,
	singlePostFixture,
	subscribersFixture,
	tagsFixture,
	topPostsFixture,
	utmFixture,
	utmTopValuesFixture,
	visitsFixture,
	weeklyVisitsFixture,
	wordAdsStatsFixture,
} from '../__fixtures__/stats';

describe( 'Stats normalizers', () => {
	it( 'normalizes top posts into report data', () => {
		expect(
			sanitizeStatsTopPostsResponse( topPostsFixture, { period: 'day', date: '2026-06-16' } ).data
		).toEqual( [
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				value: 64,
				link: 'https://example.com/hello/',
			} ),
		] );
	} );

	it( 'normalizes nested referrers', () => {
		const result = sanitizeStatsReferrersResponse( referrersFixture, {
			period: 'day',
			date: '2026-06-16',
		} );

		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'example.com/path',
				value: 12,
				actionMenu: 1,
			} )
		);
	} );

	it( 'normalizes file downloads with numeric values', () => {
		expect(
			sanitizeStatsFileDownloadsResponse( fileDownloadsFixture, {
				period: 'day',
				date: '2026-06-16',
			} ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: '/download.pdf',
				shortLabel: 'download.pdf',
				value: 5,
			} )
		);
	} );

	it( 'flattens UTM children with parent context', () => {
		expect( sanitizeStatsUtmResponse( utmFixture ).data ).toEqual( [
			expect.objectContaining( { label: 'google', value: 10 } ),
			expect.objectContaining( { label: 'google > cpc', value: 6 } ),
		] );
	} );

	it( 'keeps parsed device values when the raw payload value is a string', () => {
		expect( sanitizeStatsDevicesResponse( devicesFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Desktop',
				value: 42,
			} )
		);
	} );

	it( 'keeps parsed generic list values when the raw payload has a value field', () => {
		expect(
			sanitizeStatsGenericListResponse( genericListFixture, 'views', 'name' ).data[ 0 ]
		).toEqual(
			expect.objectContaining( {
				label: 'Example tag',
				value: 18,
			} )
		);
	} );

	it( 'normalizes visits chart data to the Premium Analytics time-series shape', () => {
		const result = sanitizeStatsVisitsResponse( visitsFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				views: 20,
				visitors: 8,
				likes: 1,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				views: 12,
				visitors: 5,
				likes: 1,
				value: 12,
			} )
		);
	} );

	it( 'normalizes subscribers chart data to the Premium Analytics time-series shape', () => {
		const result = sanitizeStatsTimeSeriesResponse( subscribersFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				subscribers: 29,
				subscribers_change: 3,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				subscribers: 14,
				subscribers_change: 2,
				value: 14,
			} )
		);
	} );

	it( 'expands weekly visits chart periods to date_start and date_end', () => {
		expect( sanitizeStatsVisitsResponse( weeklyVisitsFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				date_start: '2026-06-15',
				date_end: '2026-06-21',
				views: 20,
				visitors: 9,
			} )
		);
	} );

	it( 'normalizes email opens object-row time series to the Premium Analytics shape', () => {
		const result = sanitizeStatsTimeSeriesResponse( emailOpensTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				opens_count: 10,
				total_sends: 2,
				total_opens: 3,
				opens_rate: 1,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				opens_count: 7,
				value: 7,
			} )
		);
	} );

	it( 'normalizes email clicks time series to the Premium Analytics shape', () => {
		const result = sanitizeStatsTimeSeriesResponse( emailClicksTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				clicks_count: 7,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				clicks_count: 5,
				value: 5,
			} )
		);
	} );

	it( 'normalizes single post chart data to the Premium Analytics time-series shape', () => {
		const result = sanitizeStatsTimeSeriesResponse( singlePostFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				views: 19,
				visitors: 11,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				views: 19,
				visitors: 11,
				value: 19,
			} )
		);
	} );

	it( 'normalizes scalar days maps as time-series values', () => {
		const result = sanitizeStatsTimeSeriesResponse( scalarDaysTimeSeriesFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				value: 10,
			} )
		);
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				value: 7,
			} ),
			expect.objectContaining( {
				time_interval: '2026-06-17',
				date_start: '2026-06-17',
				date_end: '2026-06-17',
				value: 3,
			} ),
		] );
	} );

	it( 'normalizes email summary rows', () => {
		const result = sanitizeStatsEmailSummaryResponse( emailSummaryFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_sends: 10,
				opens: 7,
				clicks: 3,
				unique_opens: 5,
				unique_clicks: 2,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				value: 7,
				clicks: 3,
			} )
		);
	} );

	it( 'normalizes email opens breakdown matrices', () => {
		const result = sanitizeStatsEmailBreakdownResponse( emailOpensBreakdownFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { opens_count: 3 } ) );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				client: 'Other',
				label: 'Other',
				opens_count: 3,
				value: 3,
			} )
		);
	} );

	it( 'normalizes email clicks country breakdown matrices', () => {
		const result = sanitizeStatsEmailBreakdownResponse( emailClicksCountryBreakdownFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { clicks_count: 4 } ) );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				country: 'NZ',
				countryCode: 'NZ',
				countryFull: 'New Zealand',
				label: 'New Zealand',
				clicks_count: 4,
				value: 4,
			} )
		);
	} );

	it( 'normalizes publicize service rows', () => {
		expect( sanitizeStatsPublicizeResponse( publicizeFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'mastodon',
				value: 12,
			} )
		);
	} );

	it( 'normalizes followers subscriber rows', () => {
		const result = sanitizeStatsFollowersResponse( followersFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total: 125,
				total_email: 5,
				total_wpcom: 120,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 111,
				label: 'reader@example.com',
				value: 0,
				date_subscribed: '2026-06-16T18:53:05+00:00',
			} )
		);
	} );

	it( 'normalizes tag rows', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'News',
				value: 18,
				link: 'https://example.com/category/news/',
			} )
		);
	} );

	it( 'normalizes comments into author and post groups', () => {
		const result = sanitizeStatsCommentsResponse( commentsFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { total_comments: 22 } ) );
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				label: 'authors',
				value: 12,
			} ),
			expect.objectContaining( {
				label: 'posts',
				value: 10,
			} ),
		] );
	} );

	it( 'normalizes comment follower post rows', () => {
		const result = sanitizeStatsCommentFollowersResponse( commentFollowersFixture );

		expect( result.summary ).toEqual( expect.objectContaining( { total: 2 } ) );
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				label: 'All Posts',
				value: 20,
			} ),
			expect.objectContaining( {
				id: 41,
				label: 'Hello world',
				value: 10,
				labelIcon: 'external',
			} ),
		] );
	} );

	it( 'keeps UTM top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsUtmResponse( utmTopValuesFixture ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'google / cpc',
				value: 11,
				children: [
					expect.objectContaining( {
						id: 41,
						label: 'Hello world',
						value: 6,
					} ),
				],
			} )
		);
	} );

	it( 'keeps devices top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesTopValuesFixture ).data ).toEqual( [
			expect.objectContaining( {
				key: 'mobile',
				label: 'mobile',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'desktop',
				label: 'desktop',
				value: 4,
			} ),
		] );
	} );

	it( 'normalizes WordAds stats chart data to the Premium Analytics time-series shape', () => {
		const result = sanitizeStatsTimeSeriesResponse( wordAdsStatsFixture );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				date_start: '2026-06-16',
				date_end: '2026-06-17',
				impressions: 2000,
				revenue: 6.6,
				cpm: 6.5,
			} )
		);
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16',
				date_end: '2026-06-16',
				impressions: 1200,
				revenue: 4.2,
				cpm: 3.5,
				value: 1200,
			} )
		);
	} );
} );
