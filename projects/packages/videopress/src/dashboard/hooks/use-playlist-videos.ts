import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { PLAYLISTS_QUERY_KEY } from './use-playlists';
import type { Playlist } from '../types/playlist';

// Second tuple segment of playlist member query keys
// ([ PLAYLISTS_QUERY_KEY, PLAYLIST_VIDEOS_QUERY_SEGMENT, id ]). Nested under
// PLAYLISTS_QUERY_KEY so playlist mutations refresh members alongside terms.
export const PLAYLIST_VIDEOS_QUERY_SEGMENT = 'videos' as const;

/** The slice of a media attachment the playlist detail screen consumes. */
export type PlaylistVideo = {
	/** Attachment post ID (numeric, matching vps_playlist_order entries). */
	id: number;
	title: string;
	/** VideoPress poster URL; null for local videos / unprocessed uploads. */
	thumbnailUrl: string | null;
	durationSeconds: number;
	uploadDate: string;
	/** All playlist term IDs assigned to this attachment. */
	playlistIds: number[];
};

// Raw member shape from /wp/v2/media. Membership rides in the
// 'videopress-playlists' property (the taxonomy rest_base), which the core
// attachments controller exposes like any other taxonomy on a post.
type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	slug?: string;
	date?: string;
	media_details?: {
		length?: number;
		videopress?: { duration?: number; poster?: string };
	};
	'videopress-playlists'?: number[];
};

/**
 * Drop stale entries from a stored order list and append members it misses.
 *
 * `vps_playlist_order` is presentation-only and can drift from the real term
 * relationships (videos removed from the playlist, or added without an order
 * write). This reconciles the two: order entries whose ID is no longer a
 * member are dropped, members absent from the order are appended in the
 * sequence `memberIds` arrives in (the fetch orders by date, so appends are
 * stable by date), and duplicates keep their first position.
 *
 * @param order     - The stored `vps_playlist_order` attachment IDs.
 * @param memberIds - IDs of the attachments actually carrying the term.
 * @return The reconciled, fully-covering ordered ID list.
 */
export function resolveOrderedIds( order: number[], memberIds: number[] ): number[] {
	const members = new Set( memberIds );
	const seen = new Set< number >();
	const ordered: number[] = [];
	for ( const id of [ ...order, ...memberIds ] ) {
		if ( members.has( id ) && ! seen.has( id ) ) {
			ordered.push( id );
			seen.add( id );
		}
	}
	return ordered;
}

/**
 * Return a copy of `list` with the item at `from` moved to `to`.
 *
 * `to` is clamped to the list bounds so "move up" on the first row and "move
 * down" on the last are safe no-ops. No-ops (including an out-of-range
 * `from`) return the input array unchanged — reference equality tells
 * callers nothing moved, so they can skip a pointless mutation.
 *
 * @param list - The list to reorder.
 * @param from - Index of the item to move.
 * @param to   - Destination index (clamped into the list).
 * @return A reordered copy, or `list` itself when nothing moves.
 */
export function moveItem< T >( list: T[], from: number, to: number ): T[] {
	if ( from < 0 || from >= list.length ) {
		return list;
	}
	const clampedTo = Math.min( Math.max( to, 0 ), list.length - 1 );
	if ( clampedTo === from ) {
		return list;
	}
	const next = [ ...list ];
	const [ moved ] = next.splice( from, 1 );
	next.splice( clampedTo, 0, moved );
	return next;
}

/**
 * Apply a stored order to the fetched members: reconcile the ID lists with
 * resolveOrderedIds(), then materialize the videos in that sequence.
 *
 * @param videos - The fetched playlist members.
 * @param order  - The stored `vps_playlist_order` attachment IDs.
 * @return The members sorted for display.
 */
export function orderPlaylistVideos( videos: PlaylistVideo[], order: number[] ): PlaylistVideo[] {
	const byId = new Map( videos.map( video => [ video.id, video ] ) );
	return resolveOrderedIds(
		order,
		videos.map( video => video.id )
	).map( id => byId.get( id ) as PlaylistVideo );
}

/**
 * Transform a raw /wp/v2/media item into the slice the detail screen needs.
 *
 * @param raw - The raw media item from the REST API response.
 * @return A normalized PlaylistVideo.
 */
function toPlaylistVideo( raw: ApiMediaItem ): PlaylistVideo {
	const vpDurationMs = raw.media_details?.videopress?.duration;
	return {
		id: raw.id,
		title: raw.title?.rendered ?? raw.slug ?? '',
		thumbnailUrl: raw.media_details?.videopress?.poster ?? null,
		durationSeconds:
			vpDurationMs !== undefined
				? Math.floor( vpDurationMs / 1000 )
				: raw.media_details?.length ?? 0,
		uploadDate: raw.date ?? '',
		playlistIds: raw[ 'videopress-playlists' ] ?? [],
	};
}

/**
 * Fetch a playlist's member videos and order them for display.
 *
 * Membership is the term relationship (filtered via the taxonomy rest_base
 * query arg); `playlist.order` only decides presentation. The two are
 * reconciled client-side by orderPlaylistVideos(), so stale order entries
 * disappear and unlisted members still show up (newest first).
 * TODO: paginate via X-WP-TotalPages once a playlist can exceed the API's
 * per_page cap of 100 members.
 *
 * @param playlist - The playlist whose members to fetch, or undefined while loading.
 * @return Ordered videos, loading/error state, and a refetch callback.
 */
export function usePlaylistVideos( playlist: Playlist | undefined ) {
	const playlistId = playlist?.id;
	const query = useQuery< PlaylistVideo[] >( {
		queryKey: [ PLAYLISTS_QUERY_KEY, PLAYLIST_VIDEOS_QUERY_SEGMENT, String( playlistId ) ],
		enabled: playlistId !== undefined,
		queryFn: async () => {
			const raw = await apiFetch< ApiMediaItem[] >( {
				path: addQueryArgs( '/wp/v2/media', {
					'videopress-playlists': playlistId,
					per_page: 100,
					// Explicit date ordering so resolveOrderedIds() appends
					// order-less members deterministically (newest first).
					orderby: 'date',
					order: 'desc',
				} ),
			} );
			return raw.map( toPlaylistVideo );
		},
	} );

	const order = playlist?.order;
	const videos = useMemo(
		() => orderPlaylistVideos( query.data ?? [], order ?? [] ),
		[ query.data, order ]
	);

	return {
		videos,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
