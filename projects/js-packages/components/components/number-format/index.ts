import { getUserLocale } from '../../lib/locale';

/**
 * Format a number using the locale in use by the user viewing the page.
 *
 * @param {number} number - The number to format.
 * @param {Intl.NumberFormatOptions} options - The format options
 * @returns {string} Formatted number.
 */
const numberFormat = ( number: number, options: Intl.NumberFormatOptions = {} ): string => {
	const locale = getUserLocale();

	return new Intl.NumberFormat( locale, options ).format( number );
};

export default numberFormat;
