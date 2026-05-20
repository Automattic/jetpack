import { transformVideoPlays } from '../use-stats';

describe( 'transformVideoPlays', () => {
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
