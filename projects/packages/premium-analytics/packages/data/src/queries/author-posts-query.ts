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
import { sanitizeAuthorPostsResponse } from '../processing/author';
import { toAuthorId } from '../utils/to-post-id';
import type { AuthorPostsRecord } from '../processing/author';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { AuthorPostsRecord };

/**
 * Read the author's published post total from the response headers. The posts
 * endpoint only reports the count as `X-WP-Total`, which apiFetch's default
 * parse step discards, so this parses the page itself.
 *
 * @param authorId - The author's user ID.
 * @return The raw total.
 */
async function fetchAuthorPostTotal( authorId: number ): Promise< unknown > {
	let result: unknown;
	try {
		result = await apiFetch( {
			path: addQueryArgs( '/wp/v2/posts', {
				author: authorId,
				status: 'publish',
				per_page: 1,
				_fields: 'id',
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
		return Array.isArray( result ) ? result.length : 0;
	}

	return result.headers.get( 'X-WP-Total' );
}

/**
 * React Query options for one author's published post count, for the header
 * subtitle. A failure here only costs the count.
 *
 * @param authorId - The author's user ID.
 * @return The query options.
 */
export function authorPostsQuery( authorId: number ): UseQueryOptions< AuthorPostsRecord > {
	return {
		queryKey: [ 'author-posts', authorId ],
		queryFn: async () => {
			return sanitizeAuthorPostsResponse( await fetchAuthorPostTotal( authorId ) );
		},
		enabled: toAuthorId( authorId ) > 0,
	};
}
