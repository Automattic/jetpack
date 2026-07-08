import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { ARTWORK_MEDIA_FIELDS, artworkUrlFromMedia } from '../../client/lib/playlist-artwork';
import { PLAYLISTS_QUERY_KEY } from './use-playlists';
import type { ArtworkMedia } from '../../client/lib/playlist-artwork';
import type { Playlist } from '../types/playlist';

// Resolution logic lives in the shared lib so the block editor preview uses
// the exact same rules; re-exported here for existing consumers.
export { artworkUrlFromMedia };
export type { ArtworkMedia };

const MEDIA_FIELDS = ARTWORK_MEDIA_FIELDS;

// /wp/v2/media caps per_page at 100, so an include batch larger than that
// must be split across requests.
const MEDIA_BATCH_LIMIT = 100;

type PendingLookup = {
	id: number;
	resolve: ( media: ArtworkMedia | null ) => void;
	reject: ( error: unknown ) => void;
};

let pendingLookups: PendingLookup[] = [];
let flushScheduled = false;

/**
 * Fetch a set of media items in as few requests as possible via
 * `/wp/v2/media?include=…`, chunked to the API's per_page cap.
 *
 * @param ids - The attachment IDs to fetch (already deduplicated).
 * @return A map from attachment ID to its media item. IDs the API doesn't
 * return (deleted attachments) are simply absent.
 */
async function fetchMediaByIds( ids: number[] ): Promise< Map< number, ArtworkMedia > > {
	const byId = new Map< number, ArtworkMedia >();
	for ( let start = 0; start < ids.length; start += MEDIA_BATCH_LIMIT ) {
		const chunk = ids.slice( start, start + MEDIA_BATCH_LIMIT );
		const media = await apiFetch< ArtworkMedia[] >( {
			path: addQueryArgs( '/wp/v2/media', {
				include: chunk.join( ',' ),
				per_page: chunk.length,
				_fields: MEDIA_FIELDS,
			} ),
		} );
		media.forEach( item => byId.set( item.id, item ) );
	}
	return byId;
}

/**
 * Look up one media item, transparently batching concurrent lookups.
 *
 * The playlists LIST resolves unset-artwork fallbacks per row, and a naive
 * per-row `/wp/v2/media/{id}` fetch would be N+1 over the visible page. All
 * lookups requested within the same macrotask window (i.e. every row query
 * mounted by one render pass) are coalesced into a single
 * `/wp/v2/media?include=…` request instead; results are then handed back
 * per ID, so the per-ID query cache stays the unit of reuse.
 *
 * @param id - The attachment ID to look up.
 * @return The media item, or null when the attachment no longer exists.
 */
function loadArtworkMedia( id: number ): Promise< ArtworkMedia | null > {
	return new Promise( ( resolve, reject ) => {
		pendingLookups.push( { id, resolve, reject } );
		if ( flushScheduled ) {
			return;
		}
		flushScheduled = true;
		setTimeout( () => {
			const batch = pendingLookups;
			pendingLookups = [];
			flushScheduled = false;
			const ids = [ ...new Set( batch.map( lookup => lookup.id ) ) ];
			fetchMediaByIds( ids ).then(
				byId => batch.forEach( lookup => lookup.resolve( byId.get( lookup.id ) ?? null ) ),
				error => batch.forEach( lookup => lookup.reject( error ) )
			);
		}, 0 );
	} );
}

type UsePlaylistArtworkOptions = {
	/**
	 * Poster URL of the playlist's first video, for callers that already have
	 * the members loaded (the detail screen). Pass null for "members loaded
	 * but no usable poster"; leave undefined to let the hook resolve the
	 * fallback itself from `order[0]`.
	 */
	firstVideoPoster?: string | null;
};

/**
 * Resolve the artwork image URL for a playlist.
 *
 * Resolution order:
 * 1. `artworkId` set → fetch that attachment; image → its source URL,
 * VideoPress video → its poster.
 * 2. `artworkId` unset → the poster of the playlist's FIRST video: taken
 * from `firstVideoPoster` when the caller provides it (no fetch), else
 * resolved by fetching `order[0]`. `order` is presentation-only and can
 * drift from real membership (see use-playlist-videos), so a stale
 * `order[0]` — or an empty order on a non-empty playlist — renders the
 * placeholder until the next visit to the detail screen reconciles it;
 * an accepted v1 trade-off to keep the list at one batched request.
 * 3. Nothing to resolve → null (the caller's placeholder).
 *
 * Lookups are cached per attachment ID under PLAYLISTS_QUERY_KEY so playlist
 * mutations (artwork changes, reorders) refresh them alongside the terms.
 *
 * @param playlist                 - The playlist (or the artworkId/order slice of one).
 * @param options                  - Hook options.
 * @param options.firstVideoPoster - See UsePlaylistArtworkOptions.
 * @return The resolved artwork URL (null while loading / when unresolvable)
 * and whether a lookup is in flight.
 */
export function usePlaylistArtwork(
	playlist: Pick< Playlist, 'artworkId' | 'order' >,
	{ firstVideoPoster }: UsePlaylistArtworkOptions = {}
): { url: string | null; isLoading: boolean } {
	const hasArtwork = playlist.artworkId !== null;
	// Which attachment to look up: the explicit artwork, else the first
	// ordered video — unless the caller already knows that video's poster,
	// or there is nothing to fall back to.
	let mediaId: number | null = null;
	if ( hasArtwork ) {
		mediaId = playlist.artworkId;
	} else if ( firstVideoPoster === undefined ) {
		mediaId = playlist.order[ 0 ] ?? null;
	}

	const query = useQuery( {
		queryKey: [ PLAYLISTS_QUERY_KEY, 'artwork-media', mediaId ],
		enabled: mediaId !== null,
		staleTime: 5 * 60_000,
		// A missing attachment resolves to null deterministically (the include
		// query omits it); transport errors aren't worth retrying for artwork.
		retry: false,
		queryFn: () => loadArtworkMedia( mediaId as number ),
	} );

	if ( mediaId !== null ) {
		return { url: artworkUrlFromMedia( query.data ), isLoading: query.isLoading };
	}
	// Nothing to look up: either the caller supplied the fallback poster, or
	// there is no artwork and no first video to fall back to.
	return { url: firstVideoPoster ?? null, isLoading: false };
}
