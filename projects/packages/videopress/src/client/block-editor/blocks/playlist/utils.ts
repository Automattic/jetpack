/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Types
 */
import type { PlaylistEntry } from './types';

/**
 * Format a duration in milliseconds as a timecode, m:ss or h:mm:ss.
 *
 * @param durationMs - Duration in milliseconds.
 * @return Timecode string, or an empty string when the duration is unknown.
 */
export function formatTimecode( durationMs?: number ): string {
	if ( typeof durationMs !== 'number' || ! Number.isFinite( durationMs ) || durationMs <= 0 ) {
		return '';
	}

	const totalSeconds = Math.round( durationMs / 1000 );
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const seconds = String( totalSeconds % 60 ).padStart( 2, '0' );

	if ( hours > 0 ) {
		return `${ hours }:${ String( minutes ).padStart( 2, '0' ) }:${ seconds }`;
	}

	return `${ minutes }:${ seconds }`;
}

/**
 * Format a duration in milliseconds as a long runtime, e.g. "1 hr 13 min".
 *
 * @param durationMs - Duration in milliseconds.
 * @return Runtime string, or an empty string when the duration is unknown.
 */
export function formatRuntime( durationMs?: number ): string {
	if ( typeof durationMs !== 'number' || ! Number.isFinite( durationMs ) || durationMs <= 0 ) {
		return '';
	}

	const totalMinutes = Math.max( 1, Math.round( durationMs / 60000 ) );
	const hours = Math.floor( totalMinutes / 60 );
	const minutes = totalMinutes % 60;

	if ( hours > 0 && minutes > 0 ) {
		return sprintf(
			/* translators: 1: number of hours. 2: number of minutes. */
			__( '%1$d hr %2$d min', 'jetpack-videopress-pkg' ),
			hours,
			minutes
		);
	}

	if ( hours > 0 ) {
		return sprintf(
			/* translators: %d: number of hours. */
			__( '%d hr', 'jetpack-videopress-pkg' ),
			hours
		);
	}

	return sprintf(
		/* translators: %d: number of minutes. */
		__( '%d min', 'jetpack-videopress-pkg' ),
		minutes
	);
}

/**
 * Map a video's pixel height to a resolution label, e.g. "1080p" or "4K".
 *
 * @param height - Video height in pixels.
 * @return Resolution label, or an empty string when the height is unknown.
 */
export function resolutionLabel( height?: number ): string {
	if ( typeof height !== 'number' || ! Number.isFinite( height ) || height <= 0 ) {
		return '';
	}

	return height >= 2160 ? '4K' : `${ Math.round( height ) }p`;
}

/**
 * Sum the known durations of the playlist entries.
 *
 * @param videos - Playlist entries.
 * @return Total duration in milliseconds; 0 when no entry has a known duration.
 */
export function playlistRuntimeMs( videos: PlaylistEntry[] ): number {
	return videos.reduce( ( total, video ) => total + Math.max( 0, video.durationMs ?? 0 ), 0 );
}

/**
 * Return a copy of the list with one entry moved to a new position.
 *
 * @param list - Source list.
 * @param from - Index of the entry to move.
 * @param to   - Destination index.
 * @return Reordered copy, or the original list when the move is a no-op or out of range.
 */
export function moveEntry< T >( list: T[], from: number, to: number ): T[] {
	if ( from === to || from < 0 || to < 0 || from >= list.length || to >= list.length ) {
		return list;
	}

	const next = [ ...list ];
	const [ moved ] = next.splice( from, 1 );
	next.splice( to, 0, moved );
	return next;
}

/**
 * Build the VideoPress embed URL for a playlist entry.
 *
 * @param guid     - Video GUID.
 * @param autoplay - Whether the video should start playing once loaded.
 * @return Embed URL.
 */
export function playlistEmbedUrl( guid: string, autoplay: boolean ): string {
	const params = new URLSearchParams( {
		cover: '1',
		preloadContent: 'metadata',
		autoPlay: autoplay ? '1' : '0',
	} );

	return `https://videopress.com/embed/${ encodeURIComponent( guid ) }?${ params.toString() }`;
}
