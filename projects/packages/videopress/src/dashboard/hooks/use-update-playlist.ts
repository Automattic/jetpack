import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { toPlaylist } from '../types/playlist';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

export type PlaylistPatch = Partial<
	Pick< Playlist, 'name' | 'description' | 'type' | 'artworkId' >
>;

type ApiPatch = {
	name?: string;
	description?: string;
	meta?: {
		vps_playlist_type?: string;
		vps_playlist_artwork_id?: number;
	};
};

/**
 * Convert a UI PlaylistPatch to the terms REST request body. Name and
 * description are core term fields; type and artwork ride in `meta`. A null
 * artworkId writes 0, which is the "no artwork" empty value for the
 * integer meta.
 *
 * @param patch - The partial UI-layer patch object.
 * @return The request body, omitting undefined keys.
 */
export function patchToApi( patch: PlaylistPatch ): ApiPatch {
	const out: ApiPatch = {};
	if ( patch.name !== undefined ) {
		out.name = patch.name;
	}
	if ( patch.description !== undefined ) {
		out.description = patch.description;
	}
	const meta: ApiPatch[ 'meta' ] = {};
	if ( patch.type !== undefined ) {
		meta.vps_playlist_type = patch.type;
	}
	if ( patch.artworkId !== undefined ) {
		meta.vps_playlist_artwork_id = patch.artworkId ?? 0;
	}
	if ( Object.keys( meta ).length > 0 ) {
		out.meta = meta;
	}
	return out;
}

/**
 * Return a mutation that updates a playlist's name, description, type, or
 * artwork via POST /wp/v2/videopress-playlists/{id}. Empty patches send no
 * request. The playlists cache is invalidated on settle.
 *
 * @return A TanStack Query mutation object resolving to the updated Playlist
 * (or undefined for an empty patch).
 */
export function useUpdatePlaylist() {
	const client = useQueryClient();
	return useMutation< Playlist | undefined, Error, { id: number; patch: PlaylistPatch } >( {
		mutationFn: async ( { id, patch } ) => {
			const data = patchToApi( patch );
			if ( Object.keys( data ).length === 0 ) {
				return undefined;
			}
			const raw = await apiFetch< ApiPlaylistTerm >( {
				path: `${ PLAYLISTS_REST_PATH }/${ id }`,
				method: 'POST',
				data,
			} );
			return toPlaylist( raw );
		},
		onSettled: () => client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } ),
	} );
}
