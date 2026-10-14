/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { UseQueryOptions } from '@tanstack/react-query';

/**
 * React Query options for whether any category holds a published post, read locally from the core categories endpoint.
 *
 * Every published post has a category, so a site with none has no tag or category that could have views.
 *
 * @return The query options; the data is `true` when a category holds a published post.
 */
export function usedCategoryQuery(): UseQueryOptions< boolean > {
	return {
		queryKey: [ 'used-category' ],
		queryFn: async () => {
			const categories = await apiFetch< unknown >( {
				path: addQueryArgs( '/wp/v2/categories', { hide_empty: true, per_page: 1, _fields: 'id' } ),
			} );

			if ( ! Array.isArray( categories ) ) {
				throw new Error( 'Unexpected categories response.' );
			}

			return categories.length > 0;
		},
	};
}
