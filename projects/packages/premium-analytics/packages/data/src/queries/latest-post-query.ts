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

// The headline fields a single-post highlight card needs, plus the embedded
// featured media. Shared by both queries below so they stay in one shape.
const POST_CONTENT_FIELDS =
	'id,title,link,date,featured_media,_links.wp:featuredmedia,_embedded.wp:featuredmedia';

const LATEST_POST_PATH = addQueryArgs( '/wp/v2/posts', {
	per_page: 1,
	status: 'publish',
	orderby: 'date',
	order: 'desc',
	_embed: 'wp:featuredmedia',
	_fields: POST_CONTENT_FIELDS,
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

/**
 * React Query options for one published post's headline content, read locally
 * from the core WordPress posts endpoint. Same source and shape as
 * `latestPostQuery()`, addressed by ID: report data identifies a post but carries
 * no featured image, so a widget highlighting a reported post reads its content
 * on-site in a dependent request.
 *
 * Disabled until a post ID is known, and deliberately without `placeholderData`:
 * the key changes with the post, and carrying the previous post's title and image
 * over would briefly mislabel the new one.
 *
 * @param postId - The post to read. Values <= 0 leave the query disabled.
 * @return The query options for the post-content request.
 */
export function postContentQuery( postId: number ): UseQueryOptions< LatestPostResponse > {
	return {
		queryKey: [ 'post-content', postId ],
		// The path is built inside the fetcher so `postId` stays its only input,
		// which is already part of the query key above.
		queryFn: async () =>
			sanitizeLatestPostResponse(
				await apiFetch( {
					path: addQueryArgs( '/wp/v2/posts', {
						include: postId,
						per_page: 1,
						status: 'publish',
						_embed: 'wp:featuredmedia',
						_fields: POST_CONTENT_FIELDS,
					} ),
				} )
			),
		enabled: Number.isInteger( postId ) && postId > 0,
	};
}
