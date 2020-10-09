/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';

/**
 * Clean up WP locale so it matches the format expected by browsers.
 *
 * @param {string} locale - Locale given by WordPress.
 *
 * @returns {string} Browser-formatted locale.
 */
export const cleanLocale = locale => {
	const regex = /^([a-z]{2,3})(_[a-zA-Z]*?)?(?:_.*)?$/i;

	// Search for the correct locale format:
	// e.g. af, arq, fr_FR, pap_CW, de_DE_formal, art_xpirate
	const localeRegex = locale.match( regex );

	// No locale found, fallback to en-US.
	if ( ! localeRegex ) {
		return 'en-US';
	}

	return (
		// Keep only the language and the region, and replace the underscore used in WP locale by an hyphen.
		`${ localeRegex[ 1 ] }${ localeRegex[ 2 ] ? localeRegex[ 2 ] : '' }`.replace( '_', '-' )
	);
};

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
		return cleanLocale( locale );
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
