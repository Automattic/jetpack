import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { toPlaylist } from '../types/playlist';
import type { ApiPlaylistTerm, Playlist } from '../types/playlist';

export const PLAYLISTS_QUERY_KEY = 'jetpack-videopress-playlists' as const;

export const PLAYLISTS_REST_PATH = '/wp/v2/videopress-playlists';

// Stable fallback while the query has no data — which with the Studio flag
// off is every render (the query is disabled). A fresh `[]` per render would
// defeat downstream useMemo identity checks (e.g. the library's fields memo).
const NO_PLAYLISTS: Playlist[] = [];

/**
 * Fetch the full playlists collection from the core terms endpoint.
 *
 * The terms REST controller defaults to per_page=10, so we ask for the API's
 * maximum of 100 in one request.
 * TODO: paginate via X-WP-TotalPages once a site can exceed 100 playlists.
 *
 * @return The mapped playlists.
 */
async function fetchPlaylists(): Promise< Playlist[] > {
	const raw = await apiFetch< ApiPlaylistTerm[] >( {
		path: addQueryArgs( PLAYLISTS_REST_PATH, {
			per_page: 100,
			// Explicit rather than relying on the REST default (false): a
			// freshly created playlist has no videos yet and must still show
			// up, and get_terms()'s own default (true) makes this an easy
			// regression to reintroduce server-side.
			hide_empty: false,
		} ),
	} );
	return raw.map( toPlaylist );
}

/**
 * Fetch and cache the VideoPress playlists from /wp/v2/videopress-playlists.
 *
 * @param options         - Hook options.
 * @param options.enabled - When false, the query never fires (the caller sits
 *                        behind the Studio flag and the terms route isn't
 *                        registered). Defaults to true.
 * @return Playlists array, loading/error state, and a refetch callback.
 */
export function usePlaylists( { enabled = true }: { enabled?: boolean } = {} ) {
	const query = useQuery( {
		queryKey: [ PLAYLISTS_QUERY_KEY ],
		queryFn: fetchPlaylists,
		enabled,
	} );

	return {
		playlists: query.data ?? NO_PLAYLISTS,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
