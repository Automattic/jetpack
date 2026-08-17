/**
 * Formatting helpers shared by the playlist editor and view script.
 */

/**
 * Format a millisecond duration as m:ss or h:mm:ss.
 *
 * @param durationMs - Duration in milliseconds.
 * @return Formatted duration, or an empty string for unusable input.
 */
export function formatDuration( durationMs: number ): string {
	if ( ! Number.isFinite( durationMs ) || durationMs <= 0 ) {
		return '';
	}

	const totalSeconds = Math.round( durationMs / 1000 );
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const seconds = totalSeconds % 60;

	const paddedSeconds = String( seconds ).padStart( 2, '0' );

	if ( hours > 0 ) {
		return `${ hours }:${ String( minutes ).padStart( 2, '0' ) }:${ paddedSeconds }`;
	}

	return `${ minutes }:${ paddedSeconds }`;
}

/**
 * Format a millisecond duration as a long runtime, e.g. "1 hr 13 min".
 *
 * @param durationMs - Duration in milliseconds.
 * @return Formatted runtime, or an empty string for unusable input.
 */
export function formatRuntimeLong( durationMs: number ): string {
	if ( ! Number.isFinite( durationMs ) || durationMs <= 0 ) {
		return '';
	}

	const totalMinutes = Math.max( 1, Math.round( durationMs / 60000 ) );
	const hours = Math.floor( totalMinutes / 60 );
	const minutes = totalMinutes % 60;

	if ( hours > 0 ) {
		return minutes > 0 ? `${ hours } hr ${ minutes } min` : `${ hours } hr`;
	}

	return `${ minutes } min`;
}

/**
 * Map a video height to a quality/resolution badge label.
 *
 * @param height - Video height in pixels.
 * @return Badge label, or an empty string for unusable input.
 */
export function qualityLabel( height: number ): string {
	if ( ! Number.isFinite( height ) || height <= 0 ) {
		return '';
	}

	if ( height >= 2160 ) {
		return '4K';
	}

	return `${ height }p`;
}

/**
 * Sum the known durations of a list of playlist videos.
 *
 * @param videos - Playlist entries.
 * @return Total known duration in milliseconds (0 when nothing is known).
 */
export function totalDurationMs( videos: Array< { durationMs?: number } > ): number {
	return videos.reduce(
		( sum, video ) =>
			Number.isFinite( video.durationMs ) && video.durationMs > 0 ? sum + video.durationMs : sum,
		0
	);
}
