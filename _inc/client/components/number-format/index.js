/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';

/**
 * Site locale, or browser locale as fallback.
 *
 * @returns {string} Formatted Site locale (e.g. `en-US` or `fr-FR`).
 */
const getLocale = () => {
	const {
		l10n: { locale },
	} = __experimentalGetSettings();

	if ( locale ) {
		return (
			locale
				// Keep only the basic locale (WP locales can have variants, such as de_DE_formal).
				.replace( /(\w{2})?(_)?(\w{2})?(?:_)?(?:\w*)?/, '$1$2$3' )
				// Replace the underscore used in WP locale by an hyphen.
				.replace( '_', '-' )
		);
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
