/**
 * Formats a chapter start time in seconds for display and for description
 * chapter lines: MM:SS below one hour, H:MM:SS from one hour up.
 *
 * @param {number} seconds - Chapter start time in seconds.
 * @return {string} The formatted time.
 */
export function formatChapterTime( seconds: number ): string {
	const total = Math.max( 0, Math.floor( seconds ) );
	const hours = Math.floor( total / 3600 );
	const minutes = Math.floor( ( total % 3600 ) / 60 );
	const secs = total % 60;
	const mm = String( minutes ).padStart( 2, '0' );
	const ss = String( secs ).padStart( 2, '0' );

	return hours > 0 ? `${ hours }:${ mm }:${ ss }` : `${ mm }:${ ss }`;
}

/**
 * Parses a user-typed chapter time (M:SS, MM:SS, or H:MM:SS) into seconds.
 *
 * @param {string} input - The typed time.
 * @return {number|null} Seconds, or null when the input isn't a valid time.
 */
export function parseChapterTimeInput( input: string ): number | null {
	const match = /^(?:(\d{1,3}):)?([0-5]?\d):([0-5]\d)$/.exec( input.trim() );
	if ( ! match ) {
		return null;
	}

	const [ , hours = '0', minutes, seconds ] = match;
	return parseInt( hours, 10 ) * 3600 + parseInt( minutes, 10 ) * 60 + parseInt( seconds, 10 );
}

/**
 * Converts the normalized HH:MM:SS `startAt` produced by
 * `extractVideoChapters` into seconds.
 *
 * @param {string} startAt - Normalized HH:MM:SS timestamp.
 * @return {number} Seconds.
 */
export function chapterStartAtToSeconds( startAt: string ): number {
	const [ hours, minutes, seconds ] = startAt.split( ':' ).map( part => parseInt( part, 10 ) );
	return hours * 3600 + minutes * 60 + seconds;
}
