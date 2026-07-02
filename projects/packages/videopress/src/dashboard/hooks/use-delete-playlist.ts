import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';

/**
 * Return a mutation that permanently deletes one or more playlists via
 * DELETE /wp/v2/videopress-playlists/{id}?force=true. Terms don't support
 * trashing, so the REST controller requires `force=true` (it 501s without
 * it). Deleting a playlist only removes the term and its relationships —
 * the videos themselves are untouched.
 *
 * Requests run in parallel; if any fail the mutation rejects (the rest stay
 * deleted). The playlists cache is invalidated on settle and the
 * invalidation promise is returned so the mutation settles only after
 * active queries refetch.
 *
 * @return A TanStack Query mutation object whose mutateAsync accepts a single id or an array of ids.
 */
export function useDeletePlaylist() {
	const client = useQueryClient();
	return useMutation< void, Error, number | number[] >( {
		mutationFn: async input => {
			const ids = Array.isArray( input ) ? input : [ input ];
			const results = await Promise.allSettled(
				ids.map( id =>
					apiFetch( {
						path: `${ PLAYLISTS_REST_PATH }/${ id }?force=true`,
						method: 'DELETE',
					} )
				)
			);
			const failed = results.filter( result => result.status === 'rejected' ).length;
			if ( failed > 0 ) {
				throw new Error( `Failed to delete ${ failed } playlist(s)` );
			}
		},
		onSettled: () => client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } ),
	} );
}
