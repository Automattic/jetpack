import { _n, __, sprintf } from '@wordpress/i18n';

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const dateThreshold = 14 * day;

/**
 * Returns a human-readable string describing a Date in the past.
 *
 * @param {Date} timeAgo
 */
export default function describeTimeAgo( timeAgo: Date ): string {
	const diff = Date.now() - timeAgo.getTime();

	if ( diff < minute ) {
		return __( 'a few moments ago', 'jetpack-boost' );
	} else if ( diff < hour ) {
		const minutes = Math.floor( diff / minute );

		return sprintf(
			/* translators: %d is a number of minutes */
			_n( '%d minute ago', '%d minutes ago', minutes, 'jetpack-boost' ),
			minutes
		);
	} else if ( diff < day ) {
		const hours = Math.floor( diff / hour );

		return sprintf(
			/* translators: %d is a number of hours */
			_n( '%d hour ago', '%d hours ago', hours, 'jetpack-boost' ),
			hours
		);
	} else if ( diff < dateThreshold ) {
		const days = Math.floor( diff / day );

		return sprintf(
			/* translators: %d is a number of days */
			_n( '%d day ago', '%d days ago', days, 'jetpack-boost' ),
			days
		);
	}

	const sameYear = new Date().getFullYear() === timeAgo.getFullYear();
	const options: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: sameYear ? undefined : 'numeric',
	};

	return sprintf(
		/* translators: %s is a pre-translated date */
		__( 'on %s', 'jetpack-boost' ),
		timeAgo.toLocaleDateString( navigator.language, options )
	);
}
