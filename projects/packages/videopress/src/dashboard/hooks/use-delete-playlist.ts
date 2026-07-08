import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';

export type DeletePlaylistsResult = {
	succeeded: number[];
	failed: { id: number; message: string }[];
};

/**
 * Return a mutation that permanently deletes one or more playlists via
 * DELETE /wp/v2/videopress-playlists/{id}?force=true. Terms don't support
 * trashing, so the REST controller requires `force=true` (it 501s without
 * it). Deleting a playlist only removes the term and its relationships —
 * the videos themselves are untouched.
 *
 * Requests run in parallel and a failure on one playlist doesn't abort the
 * rest; the result reports which ids succeeded and which failed (matching
 * useSetPlaylists) so the caller can surface an accurate notice on partial
 * failure instead of pretending nothing was deleted. The playlists cache is
 * invalidated on settle and the invalidation promise is returned so the
 * mutation settles only after active queries refetch.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts a single id or an array of ids.
 */
export function useDeletePlaylist() {
	const client = useQueryClient();
	return useMutation< DeletePlaylistsResult, Error, number | number[] >( {
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

			const succeeded: number[] = [];
			const failed: { id: number; message: string }[] = [];
			results.forEach( ( result, index ) => {
				const id = ids[ index ];
				if ( result.status === 'fulfilled' ) {
					succeeded.push( id );
					return;
				}
				const { reason } = result;
				const message =
					reason instanceof Error
						? reason.message
						: ( reason as { message?: string } )?.message ?? String( reason );
				failed.push( { id, message } );
			} );

			return { succeeded, failed };
		},
		onSettled: () => client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } ),
	} );
}
