import { act, renderHook } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { transformVideoPlays, useStats, videoPlaysQueryOptions } from '../use-stats';

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
