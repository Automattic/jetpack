/**
 * Single-post lifetime totals — the `stats/post/{id}` endpoint.
 *
 * `post` is the site's raw post row, so numerics like `comment_count` arrive
 * as strings (matching `StatsPostRawResponse` in
 * `packages/data/src/processing/stats/post.ts`); keeping the string here
 * exercises consumers' coercion.
 */
export const mockStatsPostData = {
	views: 3820,
	like_count: 24,
	post: {
		ID: 779,
		post_title: 'Ten things I learned building my first WordPress theme',
		post_type: 'post',
		post_date_gmt: '2026-06-22 10:00:00',
		comment_count: '8',
	},
};
