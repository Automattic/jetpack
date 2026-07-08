import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { toPlaylist } from '../types/playlist';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

export type CreatePlaylistInput = {
	name: string;
	description?: string;
};

/**
 * Return a mutation that creates a playlist via POST
 * /wp/v2/videopress-playlists. Name and description are core term fields. The
 * playlists cache is invalidated on settle so the listing picks up the new
 * playlist.
 *
 * @return A TanStack Query mutation object resolving to the created Playlist.
 */
export function useCreatePlaylist() {
	const client = useQueryClient();
	return useMutation< Playlist, Error, CreatePlaylistInput >( {
		mutationFn: async ( { name, description } ) => {
			const raw = await apiFetch< ApiPlaylistTerm >( {
				path: PLAYLISTS_REST_PATH,
				method: 'POST',
				data: {
					name,
					...( description !== undefined ? { description } : {} ),
				},
			} );
			return toPlaylist( raw );
		},
		onSettled: () => client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } ),
	} );
}
