import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { toPlaylist } from '../types/playlist';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

// Second tuple segment of playlist item-detail query keys
// ([ PLAYLISTS_QUERY_KEY, PLAYLIST_ITEM_QUERY_SEGMENT, id ]). Shared so
// mutations can address the item cache without re-encoding the key shape.
export const PLAYLIST_ITEM_QUERY_SEGMENT = 'item' as const;

/**
 * Fetch and cache a single playlist term from /wp/v2/videopress-playlists/{id}.
 *
 * The key nests under PLAYLISTS_QUERY_KEY on purpose: every playlist mutation
 * invalidates that prefix, so the detail screen refreshes alongside the list.
 *
 * @param id - The numeric or string term ID to fetch.
 * @return An object with the playlist, loading/error state, and the raw error.
 */
export function usePlaylist( id: number | string ) {
	const query = useQuery< Playlist >( {
		queryKey: [ PLAYLISTS_QUERY_KEY, PLAYLIST_ITEM_QUERY_SEGMENT, String( id ) ],
		queryFn: async () => {
			const raw = await apiFetch< ApiPlaylistTerm >( {
				path: `${ PLAYLISTS_REST_PATH }/${ id }`,
			} );
			return toPlaylist( raw );
		},
		enabled: Boolean( id ),
	} );

	return {
		playlist: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	};
}
