/**
 * Internal dependencies
 */
import { getUserLocale } from 'lib/locale';

/**
 * Format a number using the locale in use by the user viewing the page.
 *
 * @param {number} number - The number to format.
 * @returns {string} Formatted number.
 */
export const numberFormat = number => {
	const locale = getUserLocale();

	return new Intl.NumberFormat( locale ).format( number );
};
