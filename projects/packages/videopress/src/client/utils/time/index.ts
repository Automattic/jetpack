/**
 * Formats the given time in milliseconds into a string with the format HH:MM:SS.DD,
 * adding hours and minutes only when needed.
 *
 * @param {number} ms - The time in milliseconds to format.
 * @returns {string} The formatted time string.
 * @example
 * const formattedTime1 = formatTime(1234567); // Returns "20:34.56"
 * const formattedTime2 = formatTime(45123);   // Returns "45.12"
 */
export function formatTime( ms: number ): string {
	const hours = Math.floor( ms / 3600000 );
	const minutes = Math.floor( ms / 60000 ) % 60;
	const seconds = Math.floor( ms / 1000 ) % 60;
	const deciseconds = Math.floor( ms / 10 ) % 100;

	const parts = [
		hours > 0 ? hours.toString().padStart( 2, '0' ) + ':' : '',
		hours > 0 || minutes > 0 ? minutes.toString().padStart( 2, '0' ) + ':' : '',
		seconds.toString().padStart( 2, '0' ),
		'.' + deciseconds.toString().padStart( 2, '0' ),
	];

	return parts.join( '' );
}
