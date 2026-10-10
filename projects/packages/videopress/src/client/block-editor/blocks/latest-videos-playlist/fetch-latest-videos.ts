/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Types
 */
import type { PlaylistEntry } from '../playlist/types';

// Bounds of the "Number of videos" control; the PHP render clamps to the same range.
export const MIN_VIDEO_COUNT = 1;
export const MAX_VIDEO_COUNT = 20;
export const DEFAULT_VIDEO_COUNT = 5;

/**
 * The parts of a wp/v2/media item this block reads.
 */
export type MediaLibraryItem = {
	id?: number;
	jetpack_videopress_guid?: unknown;
	media_details?: {
		height?: unknown;
		videopress?: {
			guid?: unknown;
			duration?: unknown;
			height?: unknown;
		};
	};
};

const GUID_PATTERN = /^[a-zA-Z0-9]{8}$/;

/**
 * Clamp a requested count to the range the block supports.
 *
 * @param count - Requested number of videos.
 * @return The count within bounds; the default when it isn't a number.
 */
export function clampVideoCount( count: unknown ): number {
	const value = Number( count );
	if ( ! Number.isFinite( value ) ) {
		return DEFAULT_VIDEO_COUNT;
	}
	return Math.min( MAX_VIDEO_COUNT, Math.max( MIN_VIDEO_COUNT, Math.round( value ) ) );
}

/**
 * Map media library items to playlist entries, in the order given. Items
 * without a valid VideoPress GUID are skipped.
 *
 * @param items - Media library items.
 * @return Playlist entries.
 */
export function entriesFromMediaItems( items: MediaLibraryItem[] ): PlaylistEntry[] {
	const entries: PlaylistEntry[] = [];

	for ( const item of items ) {
		const details = item?.media_details ?? {};

		// The REST field is empty on a site without a connection; the attachment meta still knows.
		const guid = [ item?.jetpack_videopress_guid, details.videopress?.guid ].find(
			( candidate ): candidate is string =>
				typeof candidate === 'string' && GUID_PATTERN.test( candidate )
		);
		if ( ! guid ) {
			continue;
		}

		const entry: PlaylistEntry = { guid };

		// The API isn't strict about numeric types, so coerce rather than type-check.
		const duration = Number( details.videopress?.duration );
		if ( Number.isFinite( duration ) && duration > 0 ) {
			entry.durationMs = duration;
		}
		const height = Number( details.height ?? details.videopress?.height );
		if ( Number.isFinite( height ) && height > 0 ) {
			entry.height = height;
		}

		entries.push( entry );
	}

	return entries;
}

/**
 * Fetch the site's newest VideoPress videos from the media library, newest
 * first.
 *
 * @param count - How many videos to fetch.
 * @return Playlist entries for the videos found.
 */
export async function fetchLatestVideos( count: number ): Promise< PlaylistEntry[] > {
	// The same request the PHP render makes; the package's rest_attachment_query
	// filter resolves videopress_has_guid on every host.
	const query: Record< string, string | number > = {
		per_page: clampVideoCount( count ),
		orderby: 'date',
		order: 'desc',
		videopress_has_guid: 1,
	};

	// Attachments keep their original mime there, so narrow to videos before the ID-set constraint.
	if ( isSimpleSite() ) {
		query.videopress_only_videos = 1;
	}

	const items = await apiFetch< MediaLibraryItem[] >( {
		path: addQueryArgs( '/wp/v2/media', query ),
	} );

	return entriesFromMediaItems( Array.isArray( items ) ? items : [] );
}
