import { act, renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import {
	computeChannelAverages,
	filterResponseToVideo,
	transformVideoPlays,
	transformVideoPlaysForVideo,
	useChannelAverages,
	useStats,
	useVideoStats,
	videoPlaysQueryOptions,
} from '../use-stats';

describe( 'transformVideoPlays', () => {
	it( 'returns empty stats when neither window has loaded', () => {
		const result = transformVideoPlays( undefined, undefined, 'days' );
		expect( result.views ).toEqual( { current: 0, previousPeriod: 0 } );
		expect( result.series ).toEqual( [] );
		expect( result.topVideos ).toEqual( [] );
		expect( result.topVideosByWatchTime ).toEqual( [] );
	} );

	it( 'treats a loaded-but-empty response (no days) as all zeros', () => {
		const result = transformVideoPlays( {}, undefined, 'days' );
		expect( result.views ).toEqual( { current: 0, previousPeriod: 0 } );
		expect( result.series ).toEqual( [] );
		expect( result.topVideos ).toEqual( [] );
	} );

	it( 'sums per-day totals and fills previousPeriod from the previous window', () => {
		const current = {
			days: {
				'2026-05-15': { total: { views: 10, impressions: 100, watch_time: 1 } },
				'2026-05-16': { total: { views: 20, impressions: 200, watch_time: 2 } },
			},
		};
		const previous = {
			days: {
				'2026-05-13': { total: { views: 3, impressions: 30, watch_time: 0.5 } },
			},
		};
		const result = transformVideoPlays( current, previous, 'days' );
		expect( result.views ).toEqual( { current: 30, previousPeriod: 3 } );
		expect( result.impressions ).toEqual( { current: 300, previousPeriod: 30 } );
		expect( result.watchTimeSeconds ).toEqual( {
			current: 3 * 3600,
			previousPeriod: 0.5 * 3600,
		} );
	} );

	it( 'aligns previous-window values to current buckets by ordinal position', () => {
		const current = {
			days: {
				'2026-05-15': { total: { views: 10 } },
				'2026-05-16': { total: { views: 20 } },
			},
		};
		const previous = {
			days: {
				'2026-05-13': { total: { views: 1 } },
				'2026-05-14': { total: { views: 2 } },
			},
		};
		const result = transformVideoPlays( current, previous, 'days' );
		expect( result.series ).toEqual( [
			expect.objectContaining( { date: '2026-05-15', views: 10, previousPeriodViews: 1 } ),
			expect.objectContaining( { date: '2026-05-16', views: 20, previousPeriodViews: 2 } ),
		] );
	} );

	it( 'collapses same-week days into one bucket under weeks granularity', () => {
		// 2026-05-11 is a Monday; the 11th, 12th and the Sunday 17th all
		// share the week of the 11th, while the 18th opens the next week.
		// The Sunday case exercises the `getUTCDay() || 7` wrap-around.
		const current = {
			days: {
				'2026-05-11': { total: { views: 5 } },
				'2026-05-12': { total: { views: 7 } },
				'2026-05-17': { total: { views: 3 } },
				'2026-05-18': { total: { views: 4 } },
			},
		};
		const result = transformVideoPlays( current, undefined, 'weeks' );
		expect( result.series ).toEqual( [
			expect.objectContaining( { date: '2026-05-11', views: 15 } ),
			expect.objectContaining( { date: '2026-05-18', views: 4 } ),
		] );
	} );

	it( 'collapses same-month days into a first-of-month bucket under months granularity', () => {
		const current = {
			days: {
				'2026-05-15': { total: { views: 5 } },
				'2026-05-20': { total: { views: 7 } },
				'2026-06-01': { total: { views: 4 } },
			},
		};
		const result = transformVideoPlays( current, undefined, 'months' );
		expect( result.series ).toEqual( [
			expect.objectContaining( { date: '2026-05-01', views: 12 } ),
			expect.objectContaining( { date: '2026-06-01', views: 4 } ),
		] );
	} );

	it( 'accumulates a video across days and keys by post_id', () => {
		const current = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, title: 'A', views: 3, watch_time: 1 } ] },
				'2026-05-16': { data: [ { post_id: 1, title: 'A', views: 4, watch_time: 0.5 } ] },
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos ).toHaveLength( 1 );
		expect( result.topVideos[ 0 ] ).toMatchObject( { id: '1', views: 7, watchTimeSeconds: 5400 } );
	} );

	it( 'falls back to the title as key when post_id is missing, and skips id-less entries', () => {
		const current = {
			days: {
				'2026-05-15': {
					data: [
						{ title: 'Untagged', views: 9, watch_time: 1 },
						{ views: 99, watch_time: 9 },
					],
				},
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos ).toHaveLength( 1 );
		expect( result.topVideos[ 0 ] ).toMatchObject( { id: 'Untagged', title: 'Untagged' } );
	} );

	it( 'uses the post_id as the display title when the entry has no title', () => {
		const current = {
			days: { '2026-05-15': { data: [ { post_id: 42, views: 1 } ] } },
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos[ 0 ] ).toMatchObject( { id: '42', title: '42' } );
	} );

	it( 'caps top lists at five and sorts each by its own metric', () => {
		const current = {
			days: {
				'2026-05-15': {
					data: [
						{ post_id: 1, title: 'A', views: 1, watch_time: 6 },
						{ post_id: 2, title: 'B', views: 2, watch_time: 5 },
						{ post_id: 3, title: 'C', views: 3, watch_time: 4 },
						{ post_id: 4, title: 'D', views: 4, watch_time: 3 },
						{ post_id: 5, title: 'E', views: 5, watch_time: 2 },
						{ post_id: 6, title: 'F', views: 6, watch_time: 1 },
					],
				},
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos ).toHaveLength( 5 );
		// Views: F(6) > E(5) > D(4) > C(3) > B(2); A is dropped.
		expect( result.topVideos.map( v => v.title ) ).toEqual( [ 'F', 'E', 'D', 'C', 'B' ] );
		// Watch time: A(6h) > B(5h) > C(4h) > D(3h) > E(2h); F is dropped.
		expect( result.topVideosByWatchTime.map( v => v.title ) ).toEqual( [
			'A',
			'B',
			'C',
			'D',
			'E',
		] );
	} );

	it( 'converts watch_time from hours (WPCOM unit) to seconds in totals', () => {
		const current = {
			days: {
				'2026-05-15': { total: { views: 10, impressions: 20, watch_time: 2 } },
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.watchTimeSeconds.current ).toBe( 2 * 3600 );
	} );

	it( 'converts per-video watch_time from hours to seconds in top lists', () => {
		const current = {
			days: {
				'2026-05-15': {
					data: [ { post_id: 1, title: 'A', views: 5, watch_time: 0.5 } ],
				},
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideosByWatchTime[ 0 ].watchTimeSeconds ).toBe( 1800 );
	} );

	it( 'does not surface a plays field on top videos', () => {
		const current = {
			days: {
				'2026-05-15': {
					data: [ { post_id: 1, title: 'A', views: 7, watch_time: 1 } ],
				},
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos[ 0 ] ).not.toHaveProperty( 'plays' );
		expect( result.topVideos[ 0 ].views ).toBe( 7 );
	} );

	it( 'treats missing per-video fields as zero (no plays fallback)', () => {
		const current = {
			days: {
				'2026-05-15': {
					data: [ { post_id: 1, title: 'A' } ],
				},
			},
		};
		const result = transformVideoPlays( current, undefined, 'days' );
		expect( result.topVideos[ 0 ].views ).toBe( 0 );
		expect( result.topVideosByWatchTime[ 0 ].watchTimeSeconds ).toBe( 0 );
	} );
} );

describe( 'filterResponseToVideo', () => {
	it( 'passes through undefined and day-less responses unchanged', () => {
		expect( filterResponseToVideo( undefined, 1 ) ).toBeUndefined();
		expect( filterResponseToVideo( {}, 1 ) ).toEqual( {} );
	} );

	it( "rewrites each day's totals from the target video's row", () => {
		const response = {
			days: {
				'2026-05-15': {
					total: { views: 30, impressions: 300, watch_time: 3 },
					data: [
						{ post_id: 1, title: 'A', views: 10, impressions: 100, watch_time: 1 },
						{ post_id: 2, title: 'B', views: 20, impressions: 200, watch_time: 2 },
					],
				},
			},
		};
		const filtered = filterResponseToVideo( response, 1 );
		expect( filtered?.days?.[ '2026-05-15' ].total ).toEqual( {
			views: 10,
			impressions: 100,
			watch_time: 1,
		} );
		// Only the target video's row survives in data[].
		expect( filtered?.days?.[ '2026-05-15' ].data ).toEqual( [
			expect.objectContaining( { post_id: 1 } ),
		] );
	} );

	it( 'keeps days where the video is absent, zero-filled, so bucket alignment holds', () => {
		const response = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, views: 10 } ] },
				'2026-05-16': { data: [ { post_id: 2, views: 20 } ] },
			},
		};
		const filtered = filterResponseToVideo( response, 1 );
		expect( Object.keys( filtered?.days ?? {} ) ).toHaveLength( 2 );
		expect( filtered?.days?.[ '2026-05-16' ].total ).toEqual( {
			views: 0,
			impressions: 0,
			watch_time: 0,
		} );
		expect( filtered?.days?.[ '2026-05-16' ].data ).toEqual( [] );
	} );

	it( 'skips rows lacking a post_id instead of matching them', () => {
		const response = {
			days: {
				'2026-05-15': { data: [ { title: 'Untagged', views: 9, watch_time: 1 } ] },
			},
		};
		const filtered = filterResponseToVideo( response, 1 );
		expect( filtered?.days?.[ '2026-05-15' ].total?.views ).toBe( 0 );
	} );

	it( 'matches post_id across string/number representations', () => {
		const response = {
			days: {
				'2026-05-15': { data: [ { post_id: '7', views: 5 } ] },
			},
		};
		expect( filterResponseToVideo( response, 7 )?.days?.[ '2026-05-15' ].total?.views ).toBe( 5 );
	} );
} );

describe( 'transformVideoPlaysForVideo', () => {
	it( 'returns zeroed stats, including retention, when neither window has loaded', () => {
		const result = transformVideoPlaysForVideo( undefined, undefined, 'days', 1 );
		expect( result.views ).toEqual( { current: 0, previousPeriod: 0 } );
		expect( result.retentionRate ).toEqual( { current: 0, previousPeriod: 0 } );
		expect( result.series ).toEqual( [] );
	} );

	it( 'computes per-video KPIs through the shared pipeline, ignoring other videos', () => {
		const current = {
			days: {
				'2026-05-15': {
					total: { views: 30, impressions: 300, watch_time: 3 },
					data: [
						{ post_id: 1, views: 10, impressions: 100, watch_time: 1, retention_rate: 50 },
						{ post_id: 2, views: 20, impressions: 200, watch_time: 2, retention_rate: 90 },
					],
				},
			},
		};
		const result = transformVideoPlaysForVideo( current, undefined, 'days', 1 );
		expect( result.views.current ).toBe( 10 );
		expect( result.impressions.current ).toBe( 100 );
		// Hours → seconds conversion happens in the shared pipeline.
		expect( result.watchTimeSeconds.current ).toBe( 3600 );
		expect( result.series ).toEqual( [
			expect.objectContaining( { date: '2026-05-15', views: 10, impressions: 100 } ),
		] );
	} );

	it( 'weights the retention mean by daily views', () => {
		const current = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, views: 10, retention_rate: 50 } ] },
				'2026-05-16': { data: [ { post_id: 1, views: 30, retention_rate: 100 } ] },
			},
		};
		const result = transformVideoPlaysForVideo( current, undefined, 'days', 1 );
		// ( 50 * 10 + 100 * 30 ) / 40 = 87.5 — not the unweighted 75.
		expect( result.retentionRate.current ).toBe( 87.5 );
	} );

	it( 'returns zero retention, not NaN, when the video has no views', () => {
		const current = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, views: 0, retention_rate: 80 } ] },
			},
		};
		const result = transformVideoPlaysForVideo( current, undefined, 'days', 1 );
		expect( result.retentionRate.current ).toBe( 0 );
	} );

	it( 'excludes days without a retention_rate from the weighting entirely', () => {
		const current = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, views: 10, retention_rate: 40 } ] },
				'2026-05-16': { data: [ { post_id: 1, views: 90 } ] },
			},
		};
		const result = transformVideoPlaysForVideo( current, undefined, 'days', 1 );
		// The 90 unobserved views must not dilute the mean to 4.
		expect( result.retentionRate.current ).toBe( 40 );
	} );

	it( 'computes previousPeriod retention from the previous window', () => {
		const current = {
			days: { '2026-05-15': { data: [ { post_id: 1, views: 10, retention_rate: 60 } ] } },
		};
		const previous = {
			days: { '2026-05-08': { data: [ { post_id: 1, views: 5, retention_rate: 20 } ] } },
		};
		const result = transformVideoPlaysForVideo( current, previous, 'days', 1 );
		expect( result.retentionRate ).toEqual( { current: 60, previousPeriod: 20 } );
	} );

	it( 'aligns the series across zero-filled days where the video is absent', () => {
		const current = {
			days: {
				'2026-05-15': { data: [ { post_id: 1, views: 10 } ] },
				'2026-05-16': { data: [ { post_id: 2, views: 99 } ] },
			},
		};
		const previous = {
			days: {
				'2026-05-13': { data: [ { post_id: 1, views: 1 } ] },
				'2026-05-14': { data: [ { post_id: 1, views: 2 } ] },
			},
		};
		const result = transformVideoPlaysForVideo( current, previous, 'days', 1 );
		expect( result.series ).toEqual( [
			expect.objectContaining( { date: '2026-05-15', views: 10, previousPeriodViews: 1 } ),
			expect.objectContaining( { date: '2026-05-16', views: 0, previousPeriodViews: 2 } ),
		] );
	} );
} );

describe( 'videoPlaysQueryOptions', () => {
	it( 'keys the query by path and window params', () => {
		const params = { num: 7, date: '2026-05-15' };
		const options = videoPlaysQueryOptions( params );
		expect( options.queryKey ).toEqual( [ 'jetpack-videopress-stats', 'video-plays', params ] );
	} );

	it( 'fetches the day-period video-plays endpoint with the window params', async () => {
		mockApiFetch( async () => ( {} ) );
		const options = videoPlaysQueryOptions( { num: 7, date: '2026-05-15' } );
		await options.queryFn!( {} as never );

		const [ [ args ] ] = getApiFetchMock().mock.calls;
		const path = ( args as { path: string } ).path;
		expect( path ).toContain( '/jetpack/v4/videopress/stats/video-plays' );
		expect( path ).toContain( 'period=day' );
		expect( path ).toContain( 'num=7' );
		expect( path ).toContain( 'date=2026-05-15' );
	} );
} );

describe( 'useStats', () => {
	beforeEach( () => {
		mockApiFetch( async () => ( {} ) );
	} );

	it( 'forces the previous_period comparison when Watch time becomes active', () => {
		const { result } = renderHook( () => useStats(), { wrapper: createTestWrapper() } );
		// Default comparison shares a unit with a sibling metric.
		expect( result.current.compare ).toBe( 'secondary_and_previous_period' );

		act( () => {
			result.current.setActiveMetric( 'watch_time' );
		} );

		expect( result.current.activeMetric ).toBe( 'watch_time' );
		// Watch time has no unit-sharing sibling, so the comparison must
		// collapse to previous_period.
		expect( result.current.compare ).toBe( 'previous_period' );

		// Re-selecting Watch time is idempotent: the comparison is already
		// previous_period, so it stays put rather than being reset.
		act( () => {
			result.current.setActiveMetric( 'watch_time' );
		} );
		expect( result.current.compare ).toBe( 'previous_period' );
	} );

	it( 'leaves the comparison untouched for metrics that share a unit', () => {
		const { result } = renderHook( () => useStats(), { wrapper: createTestWrapper() } );

		act( () => {
			result.current.setActiveMetric( 'impressions' );
		} );

		expect( result.current.activeMetric ).toBe( 'impressions' );
		expect( result.current.compare ).toBe( 'secondary_and_previous_period' );
	} );
} );

describe( 'useVideoStats', () => {
	it( 'shares the Overview cache: same query keys, no extra fetch, per-video shape', async () => {
		mockApiFetch( async () => ( {
			days: {
				'2026-05-15': {
					total: { views: 30, impressions: 300, watch_time: 3 },
					data: [
						{
							post_id: 1,
							title: 'A',
							views: 10,
							impressions: 100,
							watch_time: 1,
							retention_rate: 50,
						},
						{
							post_id: 2,
							title: 'B',
							views: 20,
							impressions: 200,
							watch_time: 2,
							retention_rate: 90,
						},
					],
				},
			},
		} ) );

		const client = createTestQueryClient();
		// Mount both hooks against one client, as the Overview and
		// Analytics screens would share the app-level QueryClient.
		const { result } = renderHook( () => ( { overview: useStats(), video: useVideoStats( 1 ) } ), {
			wrapper: createTestWrapper( client ),
		} );

		await waitFor( () => expect( result.current.video.isLoading ).toBe( false ) );

		// Two windows → two cache entries total, not four: the per-video
		// hook reuses the Overview's keys instead of registering its own.
		expect( client.getQueryCache().getAll() ).toHaveLength( 2 );
		// And exactly two network calls, both to the video-plays proxy.
		const calls = getApiFetchMock().mock.calls;
		expect( calls ).toHaveLength( 2 );
		for ( const [ args ] of calls ) {
			expect( ( args as { path: string } ).path ).toContain(
				'/jetpack/v4/videopress/stats/video-plays'
			);
		}

		// Same payload, two shapes: site-wide for the Overview, scoped
		// (plus retention) for the video.
		expect( result.current.overview.stats.views.current ).toBe( 30 );
		expect( result.current.video.stats.views.current ).toBe( 10 );
		expect( result.current.video.stats.retentionRate.current ).toBe( 50 );
	} );

	it( 'reports isError when a window fetch fails, instead of silent zeros', async () => {
		mockApiFetch( async () => {
			throw new Error( 'boom' );
		} );

		const { result } = renderHook( () => useVideoStats( 1 ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		// The stats payload still degrades to zeros — the flag is what lets
		// consumers avoid presenting them as real data.
		expect( result.current.stats.views.current ).toBe( 0 );
	} );
} );

describe( 'computeChannelAverages', () => {
	it( 'returns all-zero averages for an undefined or empty response', () => {
		const zero = {
			videoCount: 0,
			views: 0,
			impressions: 0,
			watchTimeSeconds: 0,
			retentionRate: 0,
		};
		expect( computeChannelAverages( undefined ) ).toEqual( zero );
		expect( computeChannelAverages( {} ) ).toEqual( zero );
		expect( computeChannelAverages( { days: { '2026-05-15': {} } } ) ).toEqual( zero );
	} );

	it( 'averages per-video totals across distinct videos and days', () => {
		const response = {
			days: {
				'2026-05-15': {
					data: [
						{ post_id: 1, views: 10, impressions: 100, watch_time: 1, retention_rate: 50 },
						{ post_id: 2, views: 30, impressions: 200, watch_time: 2, retention_rate: 90 },
					],
				},
				'2026-05-16': {
					// Same video on a second day: counts accumulate, but the
					// video is only counted once in the denominator.
					data: [ { post_id: 1, views: 20, impressions: 100, watch_time: 1 } ],
				},
			},
		};
		const averages = computeChannelAverages( response );
		expect( averages.videoCount ).toBe( 2 );
		expect( averages.views ).toBe( 30 ); // (10 + 30 + 20) / 2
		expect( averages.impressions ).toBe( 200 ); // (100 + 200 + 100) / 2
		expect( averages.watchTimeSeconds ).toBe( ( 4 * 3600 ) / 2 );
		// Retention weights by views over rows that report it: the second
		// day's row (no retention_rate) is excluded from both sides.
		expect( averages.retentionRate ).toBe( ( 50 * 10 + 90 * 30 ) / 40 );
	} );

	it( 'yields zero retention — not NaN — when no row reports a rate', () => {
		const response = {
			days: { '2026-05-15': { data: [ { post_id: 1, views: 10 } ] } },
		};
		expect( computeChannelAverages( response ).retentionRate ).toBe( 0 );
	} );
} );

describe( 'useChannelAverages', () => {
	it( 'shares the per-video current-window query: one cache entry, no extra fetch', async () => {
		mockApiFetch( async () => ( {
			days: {
				'2026-05-15': {
					total: { views: 30, impressions: 300, watch_time: 3 },
					data: [
						{ post_id: 1, views: 10, impressions: 100, watch_time: 1, retention_rate: 50 },
						{ post_id: 2, views: 20, impressions: 200, watch_time: 2, retention_rate: 90 },
					],
				},
			},
		} ) );

		const client = createTestQueryClient();
		const { result } = renderHook(
			() => ( { video: useVideoStats( 1 ), channel: useChannelAverages() } ),
			{ wrapper: createTestWrapper( client ) }
		);

		await waitFor( () => expect( result.current.channel.isLoading ).toBe( false ) );

		// useVideoStats registers two windows; useChannelAverages reuses the
		// current one instead of adding a third entry or a third fetch.
		expect( client.getQueryCache().getAll() ).toHaveLength( 2 );
		expect( getApiFetchMock().mock.calls ).toHaveLength( 2 );

		expect( result.current.channel.averages.videoCount ).toBe( 2 );
		expect( result.current.channel.averages.views ).toBe( 15 );
		expect( result.current.channel.averages.retentionRate ).toBe( ( 50 * 10 + 90 * 20 ) / 30 );
	} );

	it( 'reports isError when the window fetch fails, instead of silent zero averages', async () => {
		mockApiFetch( async () => {
			throw new Error( 'boom' );
		} );

		const { result } = renderHook( () => useChannelAverages(), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.averages.videoCount ).toBe( 0 );
	} );
} );
