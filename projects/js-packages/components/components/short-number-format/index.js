/**
 * Internal dependencies
 */

import { getUserLocale } from '../../lib/locale';

/**
 * Format a number using the locale in use by the user viewing the page in a short format
 *
 * @param {number} number - The number to format
 * @returns {string} Formatted number.
 */

const shortNumberFormat = number => {
	// Check if the shortened number will be less than 3 digits
	const length = Math.ceil( Math.log10( Math.abs( number ) ) ) % 3;

	// Gets the locale details from WordPress or browser locale as fallback
	const locale = getUserLocale();

	let options = {};

	if ( length > 0 ) {
		options = { notation: 'compact', maximumFractionDigits: 1 };
	} else {
		options = { notation: 'compact', maximumFractionDigits: 0 };
	}

	return new Intl.NumberFormat( locale, options ).format( number );
};

export default shortNumberFormat;
