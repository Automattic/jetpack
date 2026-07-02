import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_QUERY_KEY } from './use-library';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { PlaylistVideo } from './use-playlist-videos';

type RemoveVars = {
	/** The playlist term the video is being removed from. */
	playlistId: number;
	/** The member to remove; its playlistIds seed the new term list. */
	video: PlaylistVideo;
	/** The playlist's stored vps_playlist_order, pruned of the removed ID. */
	order: number[];
};

/**
 * Return a mutation that removes one video from a playlist.
 *
 * Two sequential writes: first the term relationship (the membership source
 * of truth) is dropped by re-writing the attachment's playlist terms without
 * this playlist, then the playlist's `vps_playlist_order` meta is pruned. A
 * failure on the second write is deliberately swallowed (matching
 * useSetPlaylists' policy for the add path): order is presentation-only,
 * resolveOrderedIds() drops entries that are no longer members, and the
 * membership removal — the write that matters — already landed.
 *
 * Both the playlists and the library caches are invalidated on settle:
 * library rows carry playlistIds (the chips column, the playlist filter, and
 * the seed for useSetPlaylists' replace-set union), so a stale library cache
 * wouldn't just display the removed membership — the next "Add to playlist"
 * could silently write it back.
 *
 * @return A TanStack Query mutation accepting `{ playlistId, video, order }`.
 */
export function useRemoveFromPlaylist() {
	const client = useQueryClient();
	return useMutation< void, Error, RemoveVars >( {
		mutationFn: async ( { playlistId, video, order } ) => {
			await apiFetch( {
				path: `/wp/v2/media/${ video.id }`,
				method: 'POST',
				data: {
					'videopress-playlists': video.playlistIds.filter( id => id !== playlistId ),
				},
			} );
			try {
				await apiFetch( {
					path: `${ PLAYLISTS_REST_PATH }/${ playlistId }`,
					method: 'POST',
					data: { meta: { vps_playlist_order: order.filter( id => id !== video.id ) } },
				} );
			} catch {
				// Swallowed — see the docblock. Failing the mutation here would
				// report an error for a removal that actually succeeded.
			}
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } );
		},
	} );
}
