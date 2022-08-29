import { getUserLocale } from '../../lib/locale';

/**
 * Format a number using the locale in use by the user viewing the page.
 *
 * @param {number} number - The number to format.
 * @returns {string} Formatted number.
 */
const numberFormat = ( number: number ): string => {
	const locale = getUserLocale();

	return new Intl.NumberFormat( locale ).format( number );
};

export default numberFormat;
