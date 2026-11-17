import { decodeEntities } from '@wordpress/html-entities';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { pickPlaybackUrl } from '../../client/utils/video-chapters/pick-playback-url';
import { buildShortcode } from './format';
import type { VideoTracksResponseBodyProps } from '../../client/types';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';

// The raw /wp/v2/media item shape consumed by toLibraryItem.
export type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	slug?: string;
	source_url?: string;
	date?: string;
	mime_type?: string;
	media_details?: {
		file_statuses?: Record< string, string >;
		original?: string;
		length?: number;
		filesize?: number;
		width?: number;
		height?: number;
		videopress?: {
			original?: string;
			duration?: number;
			poster?: string;
			finished?: boolean;
			file_url_base?: { https?: string };
			files?: Record< string, { mp4?: string } >;
		};
		// WordPress.com Simple exposes the ready poster + duration directly on
		// `media_details` (there's no `videopress` sub-object there).
		thumb?: string;
		duration_milliseconds?: number;
	};
	jetpack_videopress?: {
		guid?: string;
		rating?: string;
		display_embed?: 0 | 1 | boolean;
		allow_download?: 0 | 1 | boolean;
		privacy_setting?: 0 | 1 | 2;
		is_private?: boolean;
		description?: string;
		caption?: string;
		tracks?: VideoTracksResponseBodyProps;
	};
};

const PRIVACY_TO_INT: Record< LibraryItemPrivacy, 0 | 1 | 2 > = {
	public: 0,
	private: 1,
	'site-default': 2,
};

const PRIVACY_FROM_INT: Record< 0 | 1 | 2, LibraryItemPrivacy > = {
	0: 'public',
	1: 'private',
	2: 'site-default',
};

/**
 * Map a UI privacy string to its WPCOM integer code.
 *
 * @param value - The UI privacy string ('public' | 'private' | 'site-default').
 * @return The corresponding WPCOM integer (0 | 1 | 2).
 */
export function privacyStringToInt( value: LibraryItemPrivacy ): 0 | 1 | 2 {
	return PRIVACY_TO_INT[ value ];
}

/**
 * Map a WPCOM privacy integer to its UI string representation.
 *
 * @param value - The WPCOM integer code (0 | 1 | 2 | undefined).
 * @return The corresponding UI privacy string.
 */
export function privacyIntToString( value: 0 | 1 | 2 | undefined ): LibraryItemPrivacy {
	if ( value === undefined ) {
		return 'site-default';
	}
	return PRIVACY_FROM_INT[ value ] ?? 'site-default';
}

/**
 * Transform a raw /wp/v2/media API item into a LibraryItem.
 *
 * The single media mapper for the dashboard — the library list and the video
 * detail view (use-video.ts) consume the same endpoint and must map it
 * identically, Simple media-shape branch included.
 *
 * @param raw    - The raw media item from the REST API response.
 * @param simple - Whether the dashboard is running on WordPress.com Simple (drives the media-shape branch).
 * @return A normalized LibraryItem for the VideoPress library UI.
 */
export function toLibraryItem( raw: ApiMediaItem, simple: boolean ): LibraryItem {
	const vp = raw.jetpack_videopress;
	// Jetpack sites create the attachment as `video/videopress` before its guid
	// arrives, so the mime alone marks it VideoPress (the `type` filter agrees).
	const isVideoPress = Boolean( vp?.guid ) || raw.mime_type === 'video/videopress';
	const details = raw.media_details;
	// Self-hosted nests poster/duration/finished under `media_details.videopress`;
	// WordPress.com Simple omits that sub-object and returns a ready-to-play `thumb` +
	// `duration_milliseconds` on `media_details` itself.
	const vpDetails = details?.videopress;
	const durationMs = simple ? details?.duration_milliseconds : vpDetails?.duration;
	const durationSeconds =
		durationMs !== undefined ? Math.floor( durationMs / 1000 ) : ( details?.length ?? 0 );
	// On Simple `media_details.thumb` is a bare filename, not a URL — the ready
	// poster lives on the VideoPress CDN keyed by the video guid (same URL shape
	// the editor uses for chapter/thumbnail files).
	const poster =
		simple && vp?.guid && details?.thumb
			? `https://videos.files.wordpress.com/${ vp.guid }/${ details.thumb }`
			: vpDetails?.poster;
	const finished = vpDetails?.finished;
	// A VideoPress item with no poster isn't displayable yet: still transcoding, or —
	// on Simple — an unprocessed/orphaned record whose media_details is empty (no
	// thumb/duration, video won't load). Self-hosted additionally has finished===false;
	// on Simple that flag is absent (no media_details.videopress), so the poster check
	// carries it. Rendered as a processing placeholder instead of a blank/black tile.
	const conversionFailed = isVideoPress && details?.file_statuses?.mp4 === 'ERROR';
	const isProcessing = isVideoPress && ! conversionFailed && ( ! poster || finished === false );
	// Orientation is derived from the source dimensions; unknown (missing
	// dimensions) and square videos carry no orientation.
	const { width, height } = details ?? {};
	let orientation: LibraryItem[ 'orientation' ] = null;
	if ( width && height && width !== height ) {
		orientation = width > height ? 'landscape' : 'portrait';
	}
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: isVideoPress ? 'videopress' : 'local',
		title: decodeEntities( raw.title?.rendered ?? raw.slug ?? '' ),
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
		originalUrl: vpDetails?.original || details?.original || undefined,
		playbackUrl: pickPlaybackUrl( vpDetails ),
		isProcessing,
		conversionFailed,
		orientation,
		// The media REST field omits `tracks` today, so this is seed-only:
		// the caption manager modal fetches the authoritative list itself.
		tracks: flattenVideoTracks( vp?.tracks ),
	};
}
