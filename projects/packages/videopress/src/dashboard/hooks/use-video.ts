import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from '@wordpress/element';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { buildShortcode } from '../utils/format';
import { LIBRARY_ITEM_QUERY_SEGMENT, LIBRARY_QUERY_KEY, privacyIntToString } from './use-library';
import type { VideoTracksResponseBodyProps } from '../../client/types';
import type { LibraryItem } from '../types/library';

type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	source_url?: string;
	date?: string;
	media_details?: {
		length?: number;
		filesize?: number;
		width?: number;
		height?: number;
		videopress?: { poster?: string; duration?: number; finished?: boolean };
	};
	jetpack_videopress?: {
		guid?: string;
		rating?: string;
		display_embed?: 0 | 1 | boolean;
		allow_download?: 0 | 1 | boolean;
		privacy_setting?: 0 | 1 | 2;
		is_private?: boolean;
		description?: string;
		tracks?: VideoTracksResponseBodyProps;
	};
};

/**
 * Transform a raw /wp/v2/media API item into a LibraryItem.
 *
 * @param raw - The raw media item from the REST API response.
 * @return A normalized LibraryItem for the VideoPress UI.
 */
function toLibraryItem( raw: ApiMediaItem ): LibraryItem {
	const vp = raw.jetpack_videopress;
	const isVideoPress = Boolean( vp?.guid );
	const vpDurationMs = raw.media_details?.videopress?.duration;
	const durationSeconds =
		vpDurationMs !== undefined ? Math.floor( vpDurationMs / 1000 ) : raw.media_details?.length ?? 0;
	const poster = raw.media_details?.videopress?.poster;
	const finished = raw.media_details?.videopress?.finished;
	const isProcessing = isVideoPress && ( ! poster || finished === false );
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: isVideoPress ? 'videopress' : 'local',
		title: raw.title?.rendered ?? '',
		filename: raw.source_url?.split( '/' ).pop() ?? '',
		thumbnailUrl: poster ?? null,
		durationSeconds,
		uploadDate: raw.date ?? '',
		privacy: privacyIntToString( vp?.privacy_setting ),
		isPrivate: Boolean( vp?.is_private ),
		fileSizeBytes: raw.media_details?.filesize ?? 0,
		upload: { status: 'idle', progress: 0 },
		description: vp?.description ?? '',
		rating: ( vp?.rating ?? 'G' ) as LibraryItem[ 'rating' ],
		displayEmbed: Boolean( vp?.display_embed ),
		allowDownloads: Boolean( vp?.allow_download ),
		shortcode: buildShortcode( vp?.guid, raw.media_details?.width, raw.media_details?.height ),
		sourceUrl: raw.source_url,
		isProcessing,
		// The media REST field omits `tracks` today, so this is seed-only:
		// the caption manager modal fetches the authoritative list itself.
		tracks: flattenVideoTracks( vp?.tracks ),
	};
}

/**
 * Fetch and cache a single VideoPress media item from /wp/v2/media/{id}.
 *
 * @param id - The numeric or string media post ID to fetch.
 * @return An object with the video item, loading/error state, and the raw error.
 */
export function useVideo( id: number | string ) {
	const query = useQuery< LibraryItem >( {
		queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
		queryFn: async () => {
			const raw = await apiFetch< ApiMediaItem >( { path: `/wp/v2/media/${ id }` } );
			return toLibraryItem( raw );
		},
		enabled: Boolean( id ),
		// Re-fetch every 2s while the backend is still processing this
		// video so the poster / duration appear without a manual reload.
		refetchInterval: q => ( q.state.data?.isProcessing ? 2000 : false ),
	} );

	return {
		video: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

/**
 * Returns a callback that invalidates a single video's cached query so the next
 * read refetches it. Lets any component refresh a video after mutating it
 * out-of-band (e.g. the caption manager) without threading `refetch` through props.
 *
 * @return A function that invalidates the cache for the given media ID.
 */
export function useInvalidateVideo() {
	const client = useQueryClient();
	return useCallback(
		( id: number | string ) =>
			client.invalidateQueries( {
				queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
			} ),
		[ client ]
	);
}
