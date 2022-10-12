import * as wpdate from '@wordpress/date';

// @wordpress/date now provides getSettings in preference to __experimentalGetSettings,
// but we still have to support WP 6.0 that doesn't have that yet.
const getSettings = wpdate.getSettings || wpdate.__experimentalGetSettings;

/**
 * Clean up WP locale so it matches the format expected by browsers.
 *
 * @param {string} locale - Locale given by WordPress.
 * @returns {string} Browser-formatted locale.
 */
export const cleanLocale = ( locale: string ) => {
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

// Since global is used inside getUserLocale, we need to declare it for TS
declare const global: typeof globalThis;

/**
 * Current user locale, or browser locale as fallback.
 *
 * @returns {string} Formatted user locale (e.g. `en-US` or `fr-FR`).
 */
export const getUserLocale = () => {
	const {
		l10n: { locale },
	} = getSettings();

	if ( locale ) {
		return cleanLocale( locale );
	}

	// Fallback to the browser locale if necessary.
	const language = global?.window?.navigator?.language ?? 'en-US';

	return language;
};
