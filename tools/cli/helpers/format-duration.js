import { sprintf } from 'sprintf-js';

/**
 * A function to format a duration as h:m:s.
 *
 * @param {number} duration - Duration in milliseconds.
 * @returns {string} Formatted duration.
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
		// eslint-disable-next-line @wordpress/valid-sprintf -- This isn't WordPress's i18n sprintf.
		sprintf(
			'%d:%02d:%02d.%03d',
			Math.floor( duration / 3600000 ), // https://github.com/alexei/sprintf.js/issues/103
			Math.floor( duration / 60000 ) % 60,
			Math.floor( duration / 1000 ) % 60,
			duration % 1000
		).replace( /^[0:]+(?!\.)/, '' )
	);
}
