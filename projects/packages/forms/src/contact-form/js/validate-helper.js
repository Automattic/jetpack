/**
 * Registry for custom field validators.
 *
 * External developers can register custom validators using registerFieldValidator().
 * Validators are functions that receive (value, isRequired, extra) and return
 * 'yes' for valid, or an error key string for invalid (e.g., 'is_required', 'invalid_color').
 *
 * @type {Object.<string, Function>}
 */
const customValidators = {};

/**
 * Register a custom field validator for a specific field type.
 *
 * @param {string}   type      The field type to validate (e.g., 'color', 'custom-field').
 * @param {Function} validator Validation function: (value, isRequired, extra) => 'yes' | errorKey
 */
export const registerFieldValidator = ( type, validator ) => {
	if ( typeof validator !== 'function' ) {
		// eslint-disable-next-line no-console
		console.error( `Jetpack Forms: Validator for type "${ type }" must be a function.` );
		return;
	}
	customValidators[ type ] = validator;
};

/**
 * Get all registered custom validators.
 *
 * @returns {Object.<string, Function>} The custom validators registry.
 */
export const getCustomValidators = () => ( { ...customValidators } );

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
 * Validate a number value.
 *
 * @param  string value - The value to validate.
 * @param  object extra  - Additional validation options.
 * @returns {string} - The validation result.
 */
function validateNumber( value, extra ) {
	// Change the regex to accept both integers and decimals
	const regex = /^-?\d+(\.\d+)?$/;
	if ( ! regex.test( value ) ) {
		return 'invalid_number';
	}

	const numValue = parseFloat( value );

	if ( extra && extra.min !== undefined && numValue < parseFloat( extra.min ) ) {
		return 'invalid_min_number';
	}

	if ( extra && extra.max !== undefined && numValue > parseFloat( extra.max ) ) {
		return 'invalid_max_number';
	}

	return 'yes';
}
/**
 * Check if a value is considered empty.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - True if the value is empty, false otherwise.
 */
export const isEmptyValue = value => {
	if ( value === null || value === undefined ) {
		return true;
	}

	if ( typeof value === 'string' && value.trim() === '' ) {
		return true;
	}

	if (
		Array.isArray( value ) &&
		( value.length === 0 || value.every( item => isEmptyValue( item ) ) )
	) {
		return true;
	}

	if (
		typeof value === 'object' &&
		( Object.keys( value ).length === 0 ||
			Object.values( value ).every( item => isEmptyValue( item ) ) )
	) {
		return true;
	}

	return false;
};

/**
 * Validate a form field value.
 *
 * Returns 'yes' for valid fields, or an error key string for invalid fields.
 * Error keys can be used to look up localized error messages.
 *
 * @param {string}  type       The field type (e.g., 'email', 'url', 'text', 'color').
 * @param {*}       value      The field value to validate.
 * @param {boolean} isRequired Whether the field is required.
 * @param {*}       extra      Extra validation context (e.g., date format, min/max for numbers).
 *
 * @returns {string} 'yes' if valid, or an error key string (e.g., 'is_required', 'invalid_email').
 */
export const validateField = ( type, value, isRequired, extra = null ) => {
	// Check if there's a custom validator registered for this type
	if ( customValidators[ type ] ) {
		return customValidators[ type ]( value, isRequired, extra );
	}

	if ( isEmptyValue( value ) && isRequired ) {
		return 'is_required';
	}

	if ( ! isRequired && isEmptyValue( value ) ) {
		// No need to validate anything.
		return 'yes';
	}

	if ( 'date' === type ) {
		return validateDate( value, extra ) ? 'yes' : 'invalid_date';
	}

	if ( 'number' === type ) {
		return validateNumber( value, extra );
	}

	if ( 'file' === type ) {
		if ( value.some( file => file.error ) ) {
			return 'invalid_file_has_errors';
		}

		if ( value.some( file => ! file.isUploaded ) ) {
			return 'invalid_file_uploading';
		}

		return 'yes';
	}

	let regex = null;
	switch ( type ) {
		case 'url':
			regex =
				/^(?:(?:[Hh][Tt][Tt][Pp][Ss]?|[Ff][Tt][Pp]):\/\/)?(?:\S+(?::\S*)?@|\d{1,3}(?:\.\d{1,3}){3}|(?:[a-zA-Z\d\u00a1-\uffff](?:[a-zA-Z\d\u00a1-\uffff-]*[a-zA-Z\d\u00a1-\uffff])?)(?:\.[a-zA-Z\d\u00a1-\uffff](?:[a-zA-Z\d\u00a1-\uffff-]*[a-zA-Z\d\u00a1-\uffff])?)*(?:\.[a-zA-Z\u00a1-\uffff]{2,6}))(?::\d+)?(?:[^\s]*)?$/;
			break;
		case 'email':
			regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			break;
		case 'telephone':
			regex = /^\+?[0-9\s\-()]+$/;
			break;
	}

	if ( regex && ! regex.test( value ) ) {
		return 'invalid_' + type;
	}

	return 'yes';
};
