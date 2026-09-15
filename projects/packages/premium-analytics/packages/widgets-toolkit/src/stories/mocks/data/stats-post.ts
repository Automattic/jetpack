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

type YearTable = { total: number; months: Record< string, number > };

/**
 * The endpoint's per-year tables, rolled up from the daily series: `years`
 * carries each month's views and the year's total, `averages` the views per
 * day of each month with the year under `overall`. Months are keyed `1`-`12`.
 */
function rollUpYears( series: Array< [ string, number ] > ) {
	const years: Record< string, YearTable > = {};
	const days: Record< string, Record< string, number > > = {};

	series.forEach( ( [ date, views ] ) => {
		const year = date.slice( 0, 4 );
		const month = String( Number( date.slice( 5, 7 ) ) );

		years[ year ] = years[ year ] ?? { total: 0, months: {} };
		years[ year ].months[ month ] = ( years[ year ].months[ month ] ?? 0 ) + views;
		years[ year ].total += views;

		days[ year ] = days[ year ] ?? {};
		days[ year ][ month ] = ( days[ year ][ month ] ?? 0 ) + 1;
	} );

	const averages = Object.fromEntries(
		Object.entries( years ).map( ( [ year, { total, months } ] ) => {
			const yearDays = Object.values( days[ year ] ).reduce( ( sum, count ) => sum + count, 0 );

			return [
				year,
				{
					overall: Math.round( total / yearDays ),
					months: Object.fromEntries(
						Object.entries( months ).map( ( [ month, views ] ) => [
							month,
							Math.round( views / days[ year ][ month ] ),
						] )
					),
				},
			];
		} )
	);

	return { years, averages };
}

// Published on the series' first day, so the post's life and its stats agree.
const mockPostPublishedAt = `${ mockPostDailyViews[ 0 ][ 0 ] } 10:00:00`;

export const mockStatsPostData = {
	views: mockPostDailyViews.reduce( ( total, [ , views ] ) => total + views, 0 ),
	like_count: 24,
	data: mockPostDailyViews,
	...rollUpYears( mockPostDailyViews ),
	post: {
		ID: 779,
		post_title: 'Ten things I learned building my first WordPress theme',
		post_type: 'post',
		post_date: mockPostPublishedAt,
		post_date_gmt: mockPostPublishedAt,
		comment_count: '8',
	},
};
