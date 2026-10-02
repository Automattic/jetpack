/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
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
 * React Query options for one author's header identity, read from the site's
 * own users endpoint so private sites resolve too. `null` means the site has
 * no such author. The post count and first publish date come from
 * `authorPostsQuery`, so a failure there leaves the identity intact.
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

			return sanitizeAuthorSummaryResponse( user );
		},
		enabled: toAuthorId( authorId ) > 0,
	};
}
