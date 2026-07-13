/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { statsAppNoticesQuery, updateStatsAppNotice } from '../stats-app-notices-query';
import { statsAppPurchasesQuery } from '../stats-app-purchases-query';
import { statsAppProxyQuery } from '../stats-app-query';
import {
	statsAppReferrersMarkSpamMutation,
	statsAppReferrersSpamQuery,
	statsAppReferrersUnmarkSpamMutation,
} from '../stats-app-referrers-spam-query';
import { statsAppSiteHasNeverPublishedPostQuery } from '../stats-app-site-has-never-published-post-query';
import { statsArchivesQuery } from '../stats-archives-query';
import { statsCommentFollowersQuery } from '../stats-comment-followers-query';
import { statsCommentsQuery } from '../stats-comments-query';
import { statsDevicesQuery } from '../stats-devices-query';
import {
	statsEmailClicksBreakdownQuery,
	statsEmailOpensBreakdownQuery,
} from '../stats-email-breakdown-query';
import { statsEmailSummaryQuery } from '../stats-email-summary-query';
import {
	statsEmailClicksTimeSeriesQuery,
	statsEmailOpensTimeSeriesQuery,
} from '../stats-email-time-series-query';
import { statsFollowersQuery } from '../stats-followers-query';
import { STATS_HIGHLIGHTS_STALE_TIME, statsHighlightsQuery } from '../stats-highlights-query';
import { statsInsightsQuery } from '../stats-insights-query';
import { statsLocationsQuery } from '../stats-locations-query';
import { statsPostQuery } from '../stats-post-query';
import { statsPublicizeQuery } from '../stats-publicize-query';
import { statsSingleVideoQuery } from '../stats-single-video-query';
import { statsStreakQuery } from '../stats-streak-query';
import {
	statsSubscribersCountsQuery,
	statsSubscribersQuery,
	statsSubscribersReportQuery,
} from '../stats-subscribers-query';
import { statsTagsQuery } from '../stats-tags-query';
import { statsTopPostsQuery } from '../stats-top-posts-query';
import { statsUtmQuery } from '../stats-utm-query';
import { statsVisitsQuery } from '../stats-visits-query';
import { statsWordAdsEarningsQuery, statsWordAdsStatsQuery } from '../stats-wordads-query';
import type { StatsReportParams } from '../stats-query';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'Stats query factories', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'disables report queries until a date range is available', () => {
		expect( statsTopPostsQuery( {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'builds post stats query keys with fields', () => {
		const query = statsPostQuery( {
			postId: 41,
			fields: [ 'views', 'years' ],
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'post',
			'1.1',
			'stats/post/41',
			'GET',
			{
				fields: 'views,years',
			},
			undefined,
			'post',
		] );
	} );

	it( 'matches Calypso post stats requests when fields are omitted', () => {
		const query = statsPostQuery( { postId: 41 } );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				'stats/post/41',
				{
					fields: '',
				},
			] )
		);
	} );

	it( 'disables post stats queries until a positive post ID is available', () => {
		expect( statsPostQuery( { postId: -1 } ).enabled ).toBe( false );
		expect( statsPostQuery( { postId: 0 } ).enabled ).toBe( false );
	} );

	it( 'builds all-time email opens breakdown query keys without query params', () => {
		const query = statsEmailOpensBreakdownQuery( 41, 'country' );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'email-opens-country',
			'1.1',
			'stats/opens/emails/41/country',
			'GET',
			{},
			undefined,
			'emailBreakdown',
		] );
	} );

	it( 'builds all-time email clicks breakdown query keys per breakdown dimension', () => {
		const query = statsEmailClicksBreakdownQuery( 41, 'user-content-link' );

		expect( query.queryKey ).toEqual( [
			'stats',
			'email-clicks-user-content-link',
			'1.1',
			'stats/clicks/emails/41/user-content-link',
			'GET',
			{},
			undefined,
			'emailBreakdown',
		] );
	} );

	it( 'disables email breakdown queries until a positive post ID is available', () => {
		expect( statsEmailOpensBreakdownQuery( 0, 'client' ).enabled ).toBe( false );
		expect( statsEmailClicksBreakdownQuery( -1, 'link' ).enabled ).toBe( false );
	} );

	it( 'builds email opens time series query keys from the report date range', () => {
		const query = statsEmailOpensTimeSeriesQuery( 41, {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'email-opens-time-series',
			'1.1',
			'stats/opens/emails/41',
			'GET',
			{ period: 'day', quantity: 7, date: '2026-06-07', stats_fields: 'timeline' },
			undefined,
			'emailTimeSeries',
		] );
	} );

	it( 'clamps coarser intervals to daily over the full requested span', () => {
		expect(
			statsEmailClicksTimeSeriesQuery( 41, {
				from: '2026-06-01',
				to: '2026-06-30',
				interval: 'month',
			} ).queryKey[ 5 ]
		).toEqual( { period: 'day', quantity: 30, date: '2026-06-30', stats_fields: 'timeline' } );
	} );

	it( 'requests 24 hourly buckets per day so multi-day hourly ranges are not truncated', () => {
		expect(
			statsEmailClicksTimeSeriesQuery( 41, {
				from: '2026-06-15',
				to: '2026-06-15',
				interval: 'hour',
			} ).queryKey[ 5 ]
		).toEqual( { period: 'hour', quantity: 24, date: '2026-06-15', stats_fields: 'timeline' } );

		expect(
			statsEmailClicksTimeSeriesQuery( 41, {
				from: '2026-06-14',
				to: '2026-06-15',
				interval: 'hour',
			} ).queryKey[ 5 ]
		).toEqual( { period: 'hour', quantity: 48, date: '2026-06-15', stats_fields: 'timeline' } );
	} );

	it( 'disables email time series queries without a positive integer post ID or a date', () => {
		const range = { from: '2026-06-01', to: '2026-06-07', interval: 'day' } as const;

		expect( statsEmailOpensTimeSeriesQuery( 0, range ).enabled ).toBe( false );
		expect( statsEmailClicksTimeSeriesQuery( -1, range ).enabled ).toBe( false );
		expect( statsEmailOpensTimeSeriesQuery( 1.5, range ).enabled ).toBe( false );
		expect( statsEmailOpensTimeSeriesQuery( 41, {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'includes filter_by_country in query params when provided', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'region',
			filter_by_country: 'US',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'locations-region',
			'1.1',
			'stats/location-views/region',
			'GET',
			expect.objectContaining( { filter_by_country: 'US' } ),
			undefined,
			'locations',
		] );
	} );

	it( 'omits filter_by_country from query params when not provided', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'country',
		} );

		expect( query.queryKey[ 5 ] ).not.toHaveProperty( 'filter_by_country' );
	} );

	it( 'builds location query keys from geoMode', () => {
		const query = statsLocationsQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			geoMode: 'city',
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'locations-city',
			'1.1',
			'stats/location-views/city',
			'GET',
			expect.objectContaining( { date: '2026-06-16' } ),
			undefined,
			'locations',
		] );
	} );

	it( 'requests summarized data for multi-day report ranges', () => {
		const query = statsTopPostsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					date: '2026-06-07',
					start_date: '2026-06-01',
					days: 7,
					summarize: 1,
				} ),
			] )
		);
	} );

	it( 'requests summarized archives data for multi-day ranges', () => {
		const query = statsArchivesQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				'stats/archives',
				expect.objectContaining( {
					date: '2026-06-07',
					start_date: '2026-06-01',
					summarize: 1,
				} ),
			] )
		);
	} );

	it( 'builds tags query keys for the Calypso endpoint path', () => {
		const query = statsTagsQuery( {} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'tags',
			'1.1',
			'stats/tags',
			'GET',
			{},
			undefined,
			'tags',
		] );
	} );

	it( 'passes supported tags params through query keys', () => {
		const query = statsTagsQuery( {
			to: '2026-06-07',
			max: 10,
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'tags',
			'1.1',
			'stats/tags',
			'GET',
			{
				date: '2026-06-07',
				max: 10,
			},
			undefined,
			'tags',
		] );
	} );

	it( 'builds devices query keys from the selected device property', () => {
		const query = statsDevicesQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
			deviceProperty: 'browser',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'devices-browser',
			'1.1',
			'stats/devices/browser',
			'GET',
			expect.objectContaining( { date: '2026-06-16' } ),
			undefined,
			'devices',
		] );
	} );

	it( 'defaults devices queries to screen size data', () => {
		const query = statsDevicesQuery( {
			from: '2026-06-16',
			to: '2026-06-16',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [ 'devices-screensize', 'stats/devices/screensize', 'devices' ] )
		);
	} );

	it( 'builds comment followers query keys from pagination params without a date', () => {
		const query = statsCommentFollowersQuery( {
			max: 20,
			page: 3,
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'comment-followers',
			'1.1',
			'stats/comment-followers',
			'GET',
			expect.objectContaining( {
				max: 20,
				page: 3,
			} ),
			undefined,
			'commentFollowers',
		] );
		expect( query.queryKey[ 5 ] ).not.toHaveProperty( 'period' );
	} );

	it( 'preserves explicit summarize params', () => {
		const query = statsTopPostsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			summarize: false,
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					date: '2026-06-07',
					days: 7,
					summarize: false,
				} ),
			] )
		);
	} );

	it( 'builds followers query keys from Calypso endpoint defaults', () => {
		const query = statsFollowersQuery();

		expect( query.queryKey ).toEqual( [
			'stats',
			'followers',
			'1.1',
			'stats/followers',
			'GET',
			{ type: 'all', filter_admin: false, max: 10 },
			undefined,
			'followers',
		] );
	} );

	it( 'includes followers endpoint-specific params in query keys', () => {
		const query = statsFollowersQuery( {
			type: 'wpcom',
			filter_admin: true,
			max: 20,
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'followers',
			'1.1',
			'stats/followers',
			'GET',
			{ type: 'wpcom', filter_admin: true, max: 20 },
			undefined,
			'followers',
		] );
	} );

	it( 'requests the email summary with Calypso defaults', () => {
		const query = statsEmailSummaryQuery();

		expect( query.queryKey ).toEqual( [
			'stats',
			'email-summary',
			'1.1',
			'stats/emails/summary',
			'GET',
			{
				period: 'alltime',
				quantity: 10,
				sort_field: 'post_date',
				sort_order: 'desc',
			},
			undefined,
			'emailSummary',
		] );
	} );

	it( 'forwards email summary row count and sort overrides', () => {
		const query = statsEmailSummaryQuery( {
			quantity: 5,
			sort_field: 'opens',
			sort_order: 'asc',
		} );

		expect( query.queryKey[ 5 ] ).toEqual( {
			period: 'alltime',
			quantity: 5,
			sort_field: 'opens',
			sort_order: 'asc',
		} );
	} );

	it( 'keeps email summary at period=alltime even when an untyped caller tries to override it', () => {
		const query = statsEmailSummaryQuery( {
			period: 'day',
		} as unknown as Parameters< typeof statsEmailSummaryQuery >[ 0 ] );

		expect( query.queryKey[ 5 ] ).toEqual( {
			period: 'alltime',
			quantity: 10,
			sort_field: 'post_date',
			sort_order: 'desc',
		} );
	} );

	it( 'targets the single video endpoint by id with the single video sanitizer', () => {
		const query = statsSingleVideoQuery( 31533 );

		expect( query.queryKey ).toEqual( [
			'stats',
			'single-video',
			'1.1',
			'stats/video/31533',
			'GET',
			{ period: 'day' },
			undefined,
			'singleVideo',
		] );
	} );

	it( 'converts the report date range for the single video request', () => {
		const query = statsSingleVideoQuery( 31533, {
			from: '2026-06-08',
			to: '2026-06-14',
			interval: 'day',
		} );

		expect( query.queryKey[ 5 ] ).toEqual( {
			period: 'day',
			date: '2026-06-14',
			start_date: '2026-06-08',
			days: 7,
		} );
	} );

	it( 'disables the single video query until a valid video id is available', () => {
		expect( statsSingleVideoQuery( 0 ).enabled ).toBe( false );
		expect( statsSingleVideoQuery( NaN ).enabled ).toBe( false );
		expect( statsSingleVideoQuery( 31533 ).enabled ).toBe( true );
	} );

	it( 'builds app query keys without report param coercion', () => {
		const query = statsAppProxyQuery( {
			name: 'plan-usage',
			version: '2',
			endpoint: 'stats-app/plan-usage',
			params: { date: '2026-06-16' },
		} );

		expect( query.queryKey ).toEqual( [
			'stats-app',
			'plan-usage',
			'2',
			'stats-app/plan-usage',
			'GET',
			{ date: '2026-06-16' },
			{},
		] );
	} );

	it( 'builds app notices query keys for the local REST endpoint', () => {
		expect( statsAppNoticesQuery().queryKey ).toEqual( [ 'stats-app', 'notices', {} ] );
		expect( statsAppNoticesQuery( { force_refresh: true } ).queryKey ).toEqual( [
			'stats-app',
			'notices',
			{ force_refresh: true },
		] );
	} );

	it( 'updates app notices through the local REST endpoint', async () => {
		mockApiFetch.mockResolvedValue( { opt_in_new_stats: false } );

		await updateStatsAppNotice( {
			id: 'opt_in_new_stats',
			status: 'postponed',
			postponed_for: 300,
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/notices',
			method: 'POST',
			data: {
				id: 'opt_in_new_stats',
				status: 'postponed',
				postponed_for: 300,
			},
		} );
	} );

	it( 'builds highlights query keys with endpoint params and sanitizer', () => {
		const query = statsHighlightsQuery( { source: 'stats-feedback' } );

		expect( query.queryKey ).toEqual( [
			'stats',
			'highlights',
			'1.1',
			'stats/highlights',
			'GET',
			{ source: 'stats-feedback' },
			undefined,
			'highlights',
		] );
		expect( query.staleTime ).toBe( STATS_HIGHLIGHTS_STALE_TIME );
	} );

	it( 'builds comments query keys without date params', () => {
		const query = statsCommentsQuery();
		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'comments',
			'1.1',
			'stats/comments',
			'GET',
			{},
			undefined,
			'comments',
		] );
	} );

	it( 'builds publicize query keys without date-gating or report param coercion', () => {
		const query = statsPublicizeQuery();

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'publicize',
			'1.1',
			'stats/publicize',
			'GET',
			{},
			undefined,
			'publicize',
		] );
	} );

	it( 'shares app query keys for empty and omitted params', () => {
		expect(
			statsAppProxyQuery( {
				name: 'purchases',
				version: '1.1',
				endpoint: 'stats-app/purchases',
			} ).queryKey
		).toEqual(
			statsAppProxyQuery( {
				name: 'purchases',
				version: '1.1',
				endpoint: 'stats-app/purchases',
				params: {},
			} ).queryKey
		);
	} );

	it( 'builds app purchases query keys for the upgrades endpoint', () => {
		expect( statsAppPurchasesQuery( { site: 41 } ).queryKey ).toEqual( [
			'stats-app',
			'purchases',
			'1.2',
			'upgrades',
			'GET',
			{ site: 41 },
			{},
		] );
	} );

	it( 'passes purchases endpoint filters without report param coercion', () => {
		expect( statsAppPurchasesQuery( { type: 'transferred' } ).queryKey ).toEqual( [
			'stats-app',
			'purchases',
			'1.2',
			'upgrades',
			'GET',
			{ type: 'transferred' },
			{},
		] );
	} );

	it( 'builds subscribers query keys with Calypso endpoint params and default stat fields', () => {
		const query = statsSubscribersQuery( {
			unit: 'week',
			quantity: 12,
			date: '2026-06-25',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'subscribers',
			'1.1',
			'stats/subscribers',
			'GET',
			{
				unit: 'week',
				quantity: 12,
				date: '2026-06-25',
				stat_fields: 'subscribers,subscribers_paid',
			},
			undefined,
			'subscribers',
		] );
	} );

	it( 'preserves explicit subscribers stat fields', () => {
		const query = statsSubscribersQuery( {
			unit: 'day',
			quantity: 30,
			date: '2026-06-25',
			stat_fields: 'subscribers',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					stat_fields: 'subscribers',
				} ),
			] )
		);
	} );

	it( 'builds subscribers counts query keys with a typed sanitizer', () => {
		const query = statsSubscribersCountsQuery();

		expect( query.queryKey ).toEqual( [
			'stats',
			'subscribers-counts',
			'2',
			'subscribers/counts',
			'GET',
			{},
			undefined,
			'subscribersCounts',
		] );
	} );

	it( 'maps a daily dashboard range onto subscribers unit/quantity/date', () => {
		const query = statsSubscribersReportQuery( {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'day',
		} as StatsReportParams );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey[ 5 ] ).toEqual( {
			unit: 'day',
			quantity: 30,
			date: '2026-06-30',
			stat_fields: 'subscribers,subscribers_paid',
		} );
	} );

	it( 'clamps unsupported intervals to a supported subscribers unit', () => {
		const query = statsSubscribersReportQuery( {
			from: '2026-01-01',
			to: '2026-06-30',
			interval: 'quarter',
		} as StatsReportParams );

		expect( query.queryKey[ 5 ] ).toEqual(
			expect.objectContaining( { unit: 'month', quantity: 6, date: '2026-06-30' } )
		);
	} );

	it( 'disables the subscribers report query and omits date until a range is available', () => {
		const query = statsSubscribersReportQuery( {} as StatsReportParams );

		expect( query.enabled ).toBe( false );
		expect( query.queryKey[ 5 ] ).not.toHaveProperty( 'date' );
	} );

	it( 'builds WordAds stats query keys with the range translated to endpoint params', () => {
		const query = statsWordAdsStatsQuery( {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'wordads-stats',
			'1.1',
			'wordads/stats',
			'GET',
			{
				unit: 'month',
				date: '2026-06-30',
				quantity: 2,
			},
			undefined,
			'wordAdsStats',
			{
				period: 'month',
				date: '2026-06-30',
			},
		] );
	} );

	it( 'sets the WordAds quantity to the bucket count spanning the range', () => {
		expect(
			statsWordAdsStatsQuery( {
				from: '2026-06-01',
				to: '2026-06-07',
				interval: 'day',
			} ).queryKey
		).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					unit: 'day',
					quantity: 7,
				} ),
			] )
		);
		expect(
			statsWordAdsStatsQuery( {
				from: '2026-06-01',
				to: '2026-06-30',
				interval: 'day',
				quantity: 14,
			} ).queryKey
		).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					unit: 'day',
					quantity: 14,
				} ),
			] )
		);
	} );

	it( 'clamps the WordAds window end to yesterday, keeping it anchored to the range start', () => {
		// WordAds stats are computed nightly, so a range ending today ends at
		// yesterday instead. The window stays anchored to the range start: the
		// unavailable trailing bucket is dropped (quantity 7 → 6), so the window
		// does not shift a bucket earlier and overlap the comparison window.
		jest.useFakeTimers().setSystemTime( new Date( '2026-06-15T12:00:00Z' ) );

		try {
			expect(
				statsWordAdsStatsQuery( {
					from: '2026-06-09',
					to: '2026-06-15',
					interval: 'day',
				} ).queryKey
			).toEqual(
				expect.arrayContaining( [
					expect.objectContaining( {
						unit: 'day',
						date: '2026-06-14',
						quantity: 6,
					} ),
				] )
			);
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'disables WordAds stats queries until a date is available', () => {
		expect( statsWordAdsStatsQuery( {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'builds WordAds earnings query keys without request params', () => {
		expect( statsWordAdsEarningsQuery().queryKey ).toEqual( [
			'stats',
			'wordads-earnings',
			'1.1',
			'wordads/earnings',
			'GET',
			{},
			undefined,
			'wordAdsEarnings',
		] );
	} );

	it( 'sets visits quantity for day ranges', () => {
		const query = statsVisitsQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					unit: 'day',
					date: '2026-06-07',
					start_date: '2026-06-01',
					quantity: 7,
				} ),
			] )
		);
	} );

	it( 'builds UTM query keys from the selected UTM parameter', () => {
		const query = statsUtmQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			utmParam: 'utm_campaign,utm_source,utm_medium',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'utm',
			'1.1',
			'stats/utm/utm_campaign,utm_source,utm_medium',
			'GET',
			{
				max: 10,
				date: '2026-06-07',
				days: 7,
				start_date: '2026-06-01',
				post_id: '',
				query_top_posts: true,
			},
			undefined,
			'utm',
			{ utm_param: 'utm_campaign,utm_source,utm_medium' },
		] );
		expect( query.enabled ).toBe( true );
	} );

	it( 'disables UTM top posts when querying a post detail', () => {
		const query = statsUtmQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			post_id: 41,
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				'stats/utm/utm_source,utm_medium',
				expect.objectContaining( {
					post_id: 41,
					query_top_posts: false,
				} ),
			] )
		);
	} );

	it( 'treats zero UTM post IDs as omitted', () => {
		const query = statsUtmQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			post_id: 0,
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					post_id: '',
					query_top_posts: true,
				} ),
			] )
		);
	} );

	it( 'preserves explicit UTM top posts boolean params', () => {
		const query = statsUtmQuery( {
			from: '2026-06-01',
			to: '2026-06-07',
			interval: 'day',
			query_top_posts: false,
		} );

		expect( query.queryKey ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					query_top_posts: false,
				} ),
			] )
		);
	} );

	it( 'omits visits quantity for non-day ranges', () => {
		const query = statsVisitsQuery( {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'month',
		} );
		const apiParams = query.queryKey[ 5 ] as Record< string, unknown >;

		expect( apiParams ).toEqual(
			expect.objectContaining( {
				unit: 'month',
				date: '2026-06-30',
				start_date: '2026-06-01',
			} )
		);
		expect( apiParams ).not.toHaveProperty( 'quantity' );
	} );

	it( 'builds insights query keys without report params', () => {
		expect( statsInsightsQuery().queryKey ).toEqual( [
			'stats',
			'insights',
			'1.1',
			'stats/insights',
			'GET',
			{},
			undefined,
			'insights',
		] );
	} );

	it( 'builds streak query keys with Calypso endpoint params', () => {
		const query = statsStreakQuery( {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'day',
			gmtOffset: 12,
			max: 3000,
		} );

		expect( query.enabled ).toBe( true );
		expect( query.queryKey ).toEqual( [
			'stats',
			'streak',
			'1.1',
			'stats/streak',
			'GET',
			{
				startDate: '2026-06-01',
				endDate: '2026-06-30',
				gmtOffset: 12,
				max: 3000,
			},
			undefined,
			'streak',
		] );
	} );

	it( 'disables streak queries until start and end dates are available', () => {
		expect( statsStreakQuery( {} as StatsReportParams ).enabled ).toBe( false );
	} );

	it( 'builds the published state query against the WPCOM proxy endpoint', () => {
		expect( statsAppSiteHasNeverPublishedPostQuery( { 'include-pages': true } ).queryKey ).toEqual(
			[
				'stats-app',
				'site-has-never-published-post',
				'2',
				'site-has-never-published-post',
				'GET',
				{ 'include-pages': true },
				{},
			]
		);
	} );

	it( 'builds the referrers spam app query key', () => {
		expect( statsAppReferrersSpamQuery().queryKey ).toEqual( [
			'stats-app',
			'referrers-spam',
			'1.1',
			'stats/referrers/spam',
			'GET',
			{},
			{},
		] );
	} );

	it( 'builds referrers spam mutation requests with domain query params', () => {
		expect( statsAppReferrersMarkSpamMutation( { domain: 'spam.example' } ) ).toEqual( {
			version: '1.1',
			endpoint: 'stats/referrers/spam/new',
			method: 'POST',
			params: { domain: 'spam.example' },
		} );
		expect( statsAppReferrersUnmarkSpamMutation( { domain: 'spam.example' } ) ).toEqual( {
			version: '1.1',
			endpoint: 'stats/referrers/spam/delete',
			method: 'POST',
			params: { domain: 'spam.example' },
		} );
	} );
} );
