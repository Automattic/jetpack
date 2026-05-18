import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { buildShortcode } from '../utils/format';
import { privacyIntToString } from './use-library';
import type { MockLibraryItem } from '../types/library';

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
	};
	jetpack_videopress?: {
		guid?: string;
		rating?: string;
		display_embed?: 0 | 1 | boolean;
		allow_download?: 0 | 1 | boolean;
		privacy_setting?: 0 | 1 | 2;
		is_private?: boolean;
		description?: string;
		poster?: string;
	};
};

/**
 * Transform a raw /wp/v2/media API item into a MockLibraryItem.
 *
 * @param raw - The raw media item from the REST API response.
 * @return A normalized MockLibraryItem for the VideoPress UI.
 */
function toLibraryItem( raw: ApiMediaItem ): MockLibraryItem {
	const vp = raw.jetpack_videopress;
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: vp?.guid ? 'videopress' : 'local',
		title: raw.title?.rendered ?? '',
		filename: raw.source_url?.split( '/' ).pop() ?? '',
		thumbnailUrl: vp?.poster ?? null,
		durationSeconds: raw.media_details?.length ?? 0,
		uploadDate: raw.date ?? '',
		privacy: privacyIntToString( vp?.privacy_setting ),
		isPrivate: Boolean( vp?.is_private ),
		fileSizeBytes: raw.media_details?.filesize ?? 0,
		upload: { status: 'idle', progress: 0 },
		description: vp?.description ?? '',
		rating: ( vp?.rating ?? 'G' ) as MockLibraryItem[ 'rating' ],
		displayEmbed: Boolean( vp?.display_embed ),
		allowDownloads: Boolean( vp?.allow_download ),
		shortcode: buildShortcode( vp?.guid, raw.media_details?.width, raw.media_details?.height ),
		sourceUrl: raw.source_url,
	};
}

/**
 * Fetch and cache a single VideoPress media item from /wp/v2/media/{id}.
 *
 * @param id - The numeric or string media post ID to fetch.
 * @return An object with the video item, loading/error state, and the raw error.
 */
export function useVideo( id: number | string ) {
	const query = useQuery< MockLibraryItem >( {
		queryKey: [ 'jetpack-videopress-library', 'item', String( id ) ],
		queryFn: async () => {
			const raw = await apiFetch< ApiMediaItem >( { path: `/wp/v2/media/${ id }` } );
			return toLibraryItem( raw );
		},
		enabled: Boolean( id ),
	} );

	return {
		video: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	};
}
