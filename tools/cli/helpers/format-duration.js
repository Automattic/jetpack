/**
 * A function to format a duration as h:m:s.
 *
 * @param {number} duration - Duration in milliseconds.
 * @return {string} Formatted duration.
 */
export default function formatDuration( duration ) {
	let n = '';
	if ( duration < 0 ) {
		n = '-';
		duration = -duration;
	}
	duration = Math.floor( duration );

	return (
		n +
		(
			Math.floor( duration / 3600000 ) +
			':' +
			String( Math.floor( duration / 60000 ) % 60 ).padStart( 2, '0' ) +
			':' +
			String( Math.floor( duration / 1000 ) % 60 ).padStart( 2, '0' ) +
			'.' +
			String( duration % 1000 ).padStart( 3, '0' )
		).replace( /^[0:]+(?!\.)/, '' )
	);
}
