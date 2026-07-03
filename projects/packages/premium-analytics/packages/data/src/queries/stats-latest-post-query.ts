/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { sanitizeStatsLatestPostResponse } from '../processing/stats';
import type { StatsLatestPostResponse } from '../processing/stats';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { StatsLatestPostResponse };

const LATEST_POST_PATH = addQueryArgs( '/wp/v2/posts', {
	per_page: 1,
	status: 'publish',
	orderby: 'date',
	order: 'desc',
	_fields: 'id,title,link,date',
} );

/**
 * React Query options for the site's latest published post, read locally from
 * the core WordPress posts endpoint. Content is fetched on-site (not from WPCOM),
 * so it resolves even on private/unlaunched sites; the post's views, likes, and
 * comments are layered on from the Stats post endpoint by `useStatsLatestPost`.
 *
 * @return The query options for the latest-post request.
 */
export function statsLatestPostQuery(): UseQueryOptions< StatsLatestPostResponse > {
	return {
		queryKey: [ 'stats', 'latest-post' ],
		queryFn: async () =>
			sanitizeStatsLatestPostResponse( await apiFetch( { path: LATEST_POST_PATH } ) ),
		placeholderData: previousData => previousData,
	};
}
