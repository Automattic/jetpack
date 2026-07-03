/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { sanitizeLatestPostResponse } from '../processing/latest-post';
import type { LatestPostResponse } from '../processing/latest-post';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { LatestPostResponse };

const LATEST_POST_PATH = addQueryArgs( '/wp/v2/posts', {
	per_page: 1,
	status: 'publish',
	orderby: 'date',
	order: 'desc',
	_embed: 'wp:featuredmedia',
	_fields: 'id,title,link,date,featured_media,_links.wp:featuredmedia,_embedded.wp:featuredmedia',
} );

/**
 * React Query options for the site's latest published post, read locally from
 * the core WordPress posts endpoint. Content is fetched on-site (not from WPCOM),
 * so it resolves even on private/unlaunched sites; the post's views, likes, and
 * comments are layered on from the Stats post endpoint by the widget's `useLatestPost`.
 *
 * @return The query options for the latest-post request.
 */
export function latestPostQuery(): UseQueryOptions< LatestPostResponse > {
	return {
		queryKey: [ 'latest-post' ],
		queryFn: async () => sanitizeLatestPostResponse( await apiFetch( { path: LATEST_POST_PATH } ) ),
		placeholderData: previousData => previousData,
	};
}
