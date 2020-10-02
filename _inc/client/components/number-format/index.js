/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';

/**
 * Site locale, or browser locale as fallback.
 *
 * @returns {string} Formatted Site locale (e.g. `en-US` or `fr-FR`).
 */
export const getLocale = () => {
	const {
		l10n: { locale },
	} = __experimentalGetSettings();

	if ( locale ) {
		// WP uses underscores, but browsers use hyphens.
		return locale.replace( '_', '-' );
	}

	// Fallback to the browser locale if necessary.
	const language = global?.window?.navigator?.language ?? 'en-US';

	return language;
};

/**
 * Format a number using the locale in use on the site.
 *
 * @param {number} number - The number to format.
 *
 * @returns {string} Formatted number.
 */
export const numberFormat = number => {
	const locale = getLocale();

	return new Intl.NumberFormat( locale ).format( number );
};
