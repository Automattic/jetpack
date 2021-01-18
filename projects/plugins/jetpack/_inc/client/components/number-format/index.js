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
	const regex = /^([a-z]{2,3})(_[a-z]{2}|_[a-z][a-z0-9]{4,7})?(?:_.*)?$/i;

	// Search for the correct locale format:
	// e.g. af, arq, fr_FR, pap_CW, de_DE_formal, art_xpirate
	const localeRegex = locale.match( regex );

	// Locale was set to something that seems invalid, fallback to en-US.
	if ( ! localeRegex ) {
		return 'en-US';
	}

	return (
		// Keep only the language and the region, and replace the underscore used in WP locale by an hyphen.
		`${ localeRegex[ 1 ] }${ localeRegex[ 2 ] ? localeRegex[ 2 ] : '' }`.replace( '_', '-' )
	);
};

/**
 * Current user locale, or browser locale as fallback.
 *
 * @returns {string} Formatted user locale (e.g. `en-US` or `fr-FR`).
 */
export const getUserLocale = () => {
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
 * Format a number using the locale in use by the user viewing the page.
 *
 * @param {number} number - The number to format.
 *
 * @returns {string} Formatted number.
 */
export const numberFormat = number => {
	const locale = getUserLocale();

	return new Intl.NumberFormat( locale ).format( number );
};
