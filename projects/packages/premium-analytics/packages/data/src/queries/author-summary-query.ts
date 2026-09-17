/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { isResponse } from '../api/is-response';
import { normalizeErrorResponse } from '../api/stats-proxy-fetch';
import { sanitizeAuthorSummaryResponse } from '../processing/author';
import { getApiErrorCode } from '../utils/api-error';
import { toAuthorId } from '../utils/to-post-id';
import type { AuthorSummaryRecord, AuthorSummaryResponse } from '../processing/author';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { AuthorSummaryRecord, AuthorSummaryResponse };

// Core's own "no such user" answer, matched by code, not status. Its
// `rest_user_cannot_view` 403 stays an error: the author exists, this role
// just may not read the users endpoint.
const MISSING_AUTHOR_CODES = [ 'rest_user_invalid_id' ];

/**
 * Read the author's oldest published post plus the total from the response
 * headers. The posts endpoint only reports the count as `X-WP-Total`, which
 * apiFetch's default parse step discards, so this parses the page itself.
 *
 * @param authorId - The author's user ID.
 * @return The raw posts page and its total.
 */
async function fetchAuthorPosts( authorId: number ): Promise< { posts: unknown; total: unknown } > {
	let result: unknown;
	try {
		result = await apiFetch( {
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
	} catch ( thrown ) {
		// Under `parse: false` apiFetch throws the raw `Response`; see `fetchPreservingStatus`.
		throw isResponse( thrown ) ? await normalizeErrorResponse( thrown ) : thrown;
	}

	// Storybook's mocks resolve plain data and ignore `parse`; a page of posts
	// with no headers counts what it holds.
	if ( ! isResponse( result ) ) {
		return { posts: result, total: Array.isArray( result ) ? result.length : 0 };
	}

	return { posts: await result.json(), total: result.headers.get( 'X-WP-Total' ) };
}

/**
 * React Query options for one author's header summary: user record, published
 * post count and first publish date, read from the site's own endpoints so
 * private sites resolve too. `null` means the site has no such author.
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
				const code = getApiErrorCode( error );
				if ( code !== null && MISSING_AUTHOR_CODES.includes( code ) ) {
					return null;
				}
				throw error;
			}

			const { posts, total } = await fetchAuthorPosts( authorId );

			return sanitizeAuthorSummaryResponse( user, posts, total );
		},
		enabled: toAuthorId( authorId ) > 0,
	};
}
