/**
 * External dependencies
 */
import { queryOptions } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

/**
 * React Query options for whether WordPress.com classifies the site as commercial.
 *
 * @return The query options; `data` is `undefined` when the classification cannot be read.
 */
export function siteIsCommercialQuery() {
	return queryOptions< boolean >( {
		queryKey: [ 'site-is-commercial' ],
		queryFn: async () => {
			// Connection's cached copy of the WordPress.com site record, where Odyssey Stats reads it too.
			const { data } = await apiFetch< { data: string } >( { path: '/jetpack/v4/site' } );
			return !! JSON.parse( data ).options?.is_commercial;
		},
		staleTime: Infinity,
		// Only picks between two lines of copy, so a failure settles on the default rather than waiting.
		// Readers without `edit_posts` reach the dashboard but get a 403 from this endpoint.
		retry: false,
	} );
}
