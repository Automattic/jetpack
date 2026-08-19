/**
 * Single-post detail — the `stats/post/{id}` endpoint.
 *
 * `post` is the site's raw post row, so numerics like `comment_count` arrive
 * as strings (matching `StatsPostRawResponse` in
 * `packages/data/src/processing/stats/post.ts`); keeping the string here
 * exercises consumers' coercion.
 *
 * `data` is the endpoint's full daily view history as `[date, views]` tuples.
 * The mock generates a deterministic ~400-day window ending today (a launch
 * spike decaying into a weekly wave), so the dashboard's relative date
 * presets always intersect it regardless of when the story runs.
 */

import { format, subDays } from 'date-fns';

const DAY_FORMAT = 'yyyy-MM-dd';
const SERIES_DAYS = 400;

const seriesEnd = new Date();

const mockPostDailyViews: Array< [ string, number ] > = Array.from(
	{ length: SERIES_DAYS },
	( _, index ) => {
		const date = subDays( seriesEnd, SERIES_DAYS - 1 - index );
		const launchSpike = index < 14 ? ( 14 - index ) * 25 : 0;
		const weeklyWave = 60 + Math.round( 20 * Math.sin( ( ( index % 7 ) / 7 ) * Math.PI * 2 ) );

		return [ format( date, DAY_FORMAT ), Math.max( 5, weeklyWave + launchSpike ) ];
	}
);

export const mockStatsPostData = {
	views: mockPostDailyViews.reduce( ( total, [ , views ] ) => total + views, 0 ),
	like_count: 24,
	data: mockPostDailyViews,
	post: {
		ID: 779,
		post_title: 'Ten things I learned building my first WordPress theme',
		post_type: 'post',
		post_date_gmt: '2026-06-22 10:00:00',
		comment_count: '8',
	},
};
