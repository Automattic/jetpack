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

/**
 * return true or the field error.
 * @param  type
 * @param  value
 * @param  isRequired
 * @param  extra
 *
 * @returns {string}
 */
export const validateField = ( type, value, isRequired, extra = null ) => {
	if ( value === '' && isRequired ) {
		return 'is_required';
	}

	if ( ! isRequired && value === '' ) {
		// No need to validate anything.
		return 'yes';
	}

	if ( 'url' === type ) {
		return URL.canParse( value ) ? 'yes' : 'invalid_url';
	}
	if ( 'checkbox-multiple' === type ) {
		return value.length !== 0 ? 'yes' : 'is_required';
	}
	if ( 'date' === type ) {
		return validateDate( value, extra ) ? 'yes' : 'invalid_date';
	}

	let regex = null;
	switch ( type ) {
		case 'email':
			regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			break;
		case 'telephone':
			regex = /^\+?[0-9\s\-()]+$/;
			break;
		case 'number':
			regex = /^[0-9]+$/;
			break;
	}

	if ( regex && ! regex.test( value ) ) {
		return 'invalid_' + type;
	}

	return 'yes';
};
