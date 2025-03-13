/**
 * Validate the date Value based on the format of the date field.
 *
 * @param {string} value  Date value
 * @param {string} format Date format
 *
 * @returns {boolean}
 */
export const validateDate = ( value, format ) => {
	let year, month, day;

	if ( ! value ) {
		return false;
	}
	switch ( format ) {
		case 'mm/dd/yy':
			[ month, day, year ] = value.split( '/' ).map( Number );
			break;

		case 'dd/mm/yy':
			[ day, month, year ] = value.split( '/' ).map( Number );
			break;

		case 'yy-mm-dd':
			[ year, month, day ] = value.split( '-' ).map( Number );
			break;

		default:
			return false;
	}
	if ( isNaN( year ) || isNaN( month ) || isNaN( day ) ) {
		return false;
	}

	const date = new Date( year, month - 1, day );

	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
