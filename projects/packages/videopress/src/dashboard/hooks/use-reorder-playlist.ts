import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { toPlaylist } from '../types/playlist';
import { PLAYLIST_ITEM_QUERY_SEGMENT } from './use-playlist';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

// Reorders in flight across every instance of this hook. Not isMutating():
// TanStack v5 keeps a mutation "pending" until after its own onSettled
// resolves, so two overlapping reorders settling in the same macrotask would
// each count the other (and themselves) and both skip the invalidation. The
// counter is decremented synchronously at the top of onSettled, so exactly
// one settler observes it reach zero.
let pendingReorders = 0;

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
		mutationFn: async ( { id, order } ) => {
			const raw = await apiFetch< ApiPlaylistTerm >( {
				path: `${ PLAYLISTS_REST_PATH }/${ id }`,
				method: 'POST',
				data: { meta: { vps_playlist_order: order } },
			} );
			return toPlaylist( raw );
		},
		onMutate: async ( { id, order } ) => {
			pendingReorders++;
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
			pendingReorders--;
			// Zero means this settler is the last one out; while others are
			// still pending their optimistic order is newer than anything a
			// refetch could return, so leave the caches alone.
			if ( pendingReorders === 0 ) {
				return client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } );
			}
		},
	} );
}
