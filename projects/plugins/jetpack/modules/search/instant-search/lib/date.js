/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Get user friendly date string from y-m-d h:i:s to Apr 3, 2020
 *
 * @param {string} dateTime
 * @return {string}
 */
export const getDateString = ( dateTime ) => {
	const dateTimeParts = dateTime.split( ' ' );
	if ( ! Array.isArray( dateTimeParts ) || dateTimeParts.length !== 2 ) {
		return dateTime;
	}

	const dateParts = dateTimeParts[ 0 ].split( '-' );
	if ( ! Array.isArray( dateParts ) || dateParts.length !== 3 ) {
		return dateTime;
	}

	const year = dateParts[ 0 ];
	const month = dateParts[ 1 ];
	const day = dateParts[ 2 ];

	let monthString = month;
	switch ( parseInt( month ) ) {
		case 1:
			monthString = __( 'Jan', 'jetpack' );
			break;
		case 2:
			monthString = __( 'Feb', 'jetpack' );
			break;
		case 3:
			monthString = __( 'Mar', 'jetpack' );
			break;
		case 4:
			monthString = __( 'Apr', 'jetpack' );
			break;
		case 5:
			monthString = __( 'May', 'jetpack' );
			break;
		case 6:
			monthString = __( 'Jun', 'jetpack' );
			break;
		case 7:
			monthString = __( 'Jul', 'jetpack' );
			break;
		case 8:
			monthString = __( 'Aug', 'jetpack' );
			break;
		case 9:
			monthString = __( 'Sep', 'jetpack' );
			break;
		case 10:
			monthString = __( 'Oct', 'jetpack' );
			break;
		case 11:
			monthString = __( 'Nov', 'jetpack' );
			break;
		case 12:
			monthString = __( 'Dec', 'jetpack' );
			break;
	}

	return `${monthString} ${day}, ${year}`;
};
