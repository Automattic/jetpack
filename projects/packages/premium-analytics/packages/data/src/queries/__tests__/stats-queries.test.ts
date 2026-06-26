/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from '../stats-app-query';
import { statsAppSiteHasNeverPublishedPostQuery } from '../stats-app-site-has-never-published-post-query';
import { statsArchivesQuery } from '../stats-archives-query';
import { statsCommentsQuery } from '../stats-comments-query';
import { statsDevicesQuery } from '../stats-devices-query';
import { STATS_HIGHLIGHTS_STALE_TIME, statsHighlightsQuery } from '../stats-highlights-query';
import { statsInsightsQuery } from '../stats-insights-query';
import { statsLocationsQuery } from '../stats-locations-query';
import { statsPostQuery } from '../stats-post-query';
import { statsStreakQuery } from '../stats-streak-query';
import { statsSubscribersCountsQuery, statsSubscribersQuery } from '../stats-subscribers-query';
import { statsTagsQuery } from '../stats-tags-query';
import { statsTopPostsQuery } from '../stats-top-posts-query';
import { statsUtmQuery } from '../stats-utm-query';
import { statsVisitsQuery } from '../stats-visits-query';
import type { StatsReportParams } from '../stats-query';

describe( 'Stats query factories', () => {
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
			deviceParam: 'browser',
		} );

		expect( query.queryKey ).toEqual( [
			'stats',
			'devices',
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
			expect.arrayContaining( [ 'stats/devices/screensize', 'devices' ] )
		);
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
} );
