/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { isResponse } from '../api/is-response';
import { sanitizeAuthorSummaryResponse } from '../processing/author';
import { getApiErrorStatus } from '../utils/api-error';
import type { AuthorSummary, AuthorSummaryResponse } from '../processing/author';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { AuthorSummary, AuthorSummaryResponse };

// Not found and cannot view both mean the id names nobody the reader can see
// as an author; every other failure is a real error.
const MISSING_AUTHOR_STATUSES = [ 403, 404 ];

/**
 * Read the author's oldest published post plus the total from the response
 * headers. The posts endpoint only reports the count as `X-WP-Total`, which
 * apiFetch's default parse step discards, so this parses the page itself.
 *
 * @param authorId - The author's user ID.
 * @return The raw posts page and its total.
 */
async function fetchAuthorPosts( authorId: number ): Promise< { posts: unknown; total: unknown } > {
	const result: unknown = await apiFetch( {
		path: addQueryArgs( '/wp/v2/posts', {
			author: authorId,
			status: 'publish',
			per_page: 1,
			orderby: 'date',
			order: 'asc',
			_fields: 'id,date',
		} ),
		parse: false,
	} );

	// Storybook's mocks resolve plain data and ignore `parse`; a page of posts
	// with no headers counts what it holds.
	if ( ! isResponse( result ) ) {
		return { posts: result, total: Array.isArray( result ) ? result.length : 0 };
	}

	return { posts: await result.json(), total: result.headers.get( 'X-WP-Total' ) };
}

/**
 * React Query options for one author's header summary: the user record from the
 * site's own users endpoint, joined with the author's published post count and
 * first publish date. Read locally so it resolves on private sites too.
 *
 * Resolves to `null` for an id the site cannot show as an author, so the page
 * can tell "not found" from a failed request. Disabled for ids <= 0.
 *
 * @param authorId - The author's user ID.
 * @return The query options.
 */
export function authorSummaryQuery( authorId: number ): UseQueryOptions< AuthorSummaryResponse > {
	return {
		queryKey: [ 'author-summary', authorId ],
		queryFn: async () => {
			let user: unknown;
			try {
				user = await apiFetch( {
					path: addQueryArgs( `/wp/v2/users/${ authorId }`, {
						_fields: 'id,name,avatar_urls',
					} ),
				} );
			} catch ( error ) {
				const status = getApiErrorStatus( error );
				if ( status !== null && MISSING_AUTHOR_STATUSES.includes( status ) ) {
					return null;
				}
				throw error;
			}

			const { posts, total } = await fetchAuthorPosts( authorId );

			return sanitizeAuthorSummaryResponse( user, posts, total );
		},
		enabled: Number.isInteger( authorId ) && authorId > 0,
	};
}
