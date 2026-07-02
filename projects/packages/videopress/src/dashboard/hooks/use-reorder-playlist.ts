import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { toPlaylist } from '../types/playlist';
import { PLAYLIST_ITEM_QUERY_SEGMENT } from './use-playlist';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

// Mutation key so overlapping reorders can see each other via isMutating()
// (see the onSettled guard below).
export const REORDER_PLAYLIST_MUTATION_KEY = [ 'jetpack-videopress-reorder-playlist' ] as const;

type ReorderVars = { id: number; order: number[] };

type ReorderContext = {
	previousItem?: Playlist;
	previousList?: Playlist[];
};

/**
 * Return a mutation that persists a playlist's video order to the
 * `vps_playlist_order` term meta via POST /wp/v2/videopress-playlists/{id}.
 *
 * The mutation is optimistic: the playlist item and list caches are patched
 * with the new order before the request settles, so drags land instantly.
 * In-flight playlist queries are cancelled first (a stale response would
 * clobber the optimistic order), the snapshots are restored on error, and
 * the caches are invalidated on settle — except while other reorders are
 * still pending, whose optimistic order is newer than anything a refetch
 * could return.
 *
 * @return A TanStack Query mutation accepting `{ id, order }` and resolving to the updated Playlist.
 */
export function useReorderPlaylist() {
	const client = useQueryClient();
	return useMutation< Playlist, Error, ReorderVars, ReorderContext >( {
		mutationKey: REORDER_PLAYLIST_MUTATION_KEY,
		mutationFn: async ( { id, order } ) => {
			const raw = await apiFetch< ApiPlaylistTerm >( {
				path: `${ PLAYLISTS_REST_PATH }/${ id }`,
				method: 'POST',
				data: { meta: { vps_playlist_order: order } },
			} );
			return toPlaylist( raw );
		},
		onMutate: async ( { id, order } ) => {
			await client.cancelQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } );
			const itemKey = [ PLAYLISTS_QUERY_KEY, PLAYLIST_ITEM_QUERY_SEGMENT, String( id ) ];
			const previousItem = client.getQueryData< Playlist >( itemKey );
			const previousList = client.getQueryData< Playlist[] >( [ PLAYLISTS_QUERY_KEY ] );
			if ( previousItem ) {
				client.setQueryData< Playlist >( itemKey, { ...previousItem, order } );
			}
			if ( previousList ) {
				client.setQueryData< Playlist[] >(
					[ PLAYLISTS_QUERY_KEY ],
					previousList.map( playlist => ( playlist.id === id ? { ...playlist, order } : playlist ) )
				);
			}
			return { previousItem, previousList };
		},
		onError: ( _error, { id }, context ) => {
			if ( context?.previousItem ) {
				client.setQueryData(
					[ PLAYLISTS_QUERY_KEY, PLAYLIST_ITEM_QUERY_SEGMENT, String( id ) ],
					context.previousItem
				);
			}
			if ( context?.previousList ) {
				client.setQueryData( [ PLAYLISTS_QUERY_KEY ], context.previousList );
			}
		},
		onSettled: () => {
			// Count includes this mutation, so 1 means "I'm the last one".
			if ( client.isMutating( { mutationKey: REORDER_PLAYLIST_MUTATION_KEY } ) === 1 ) {
				return client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } );
			}
		},
	} );
}
