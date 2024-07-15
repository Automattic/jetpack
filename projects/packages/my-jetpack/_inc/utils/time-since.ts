import { sprintf, _n, __ } from '@wordpress/i18n';

/**
 * Time Since
 *
 * @param {number} date - The past date (timestamp) to compare to the current date.
 * @returns {string} - A description of the amount of time between a date and now, i.e. "5 minutes ago".
 */
export function timeSince( date: number ) {
	const now = new Date();
	const offset = now.getTimezoneOffset() * 60000;

	const seconds = Math.floor( ( new Date( now.getTime() + offset ).getTime() - date ) / 1000 );

	let interval = seconds / 31536000; // 364 days
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of years i.e. "5 years ago".
			_n( '%s year ago', '%s years ago', Math.floor( interval ), 'jetpack-my-jetpack' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 2592000; // 30 days
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of months i.e. "5 months ago".
			_n( '%s month ago', '%s months ago', Math.floor( interval ), 'jetpack-my-jetpack' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 86400; // 1 day
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of days i.e. "5 days ago".
			_n( '%s day ago', '%s days ago', Math.floor( interval ), 'jetpack-my-jetpack' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 3600; // 1 hour
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of hours i.e. "5 hours ago".
			_n( '%s hour ago', '%s hours ago', Math.floor( interval ), 'jetpack-my-jetpack' ),
			Math.floor( interval )
		);
	}

	interval = seconds / 60; // 1 minute
	if ( interval > 1 ) {
		return sprintf(
			// translators: placeholder is a number amount of minutes i.e. "5 minutes ago".
			_n( '%s minute ago', '%s minutes ago', Math.floor( interval ), 'jetpack-my-jetpack' ),
			Math.floor( interval )
		);
	}

	return __( 'a few seconds ago', 'jetpack-my-jetpack' );
}
