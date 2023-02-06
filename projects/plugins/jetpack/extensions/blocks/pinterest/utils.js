import { getPath } from '@wordpress/url';
import { URL_REGEX } from '.';

/**
 * Determines the Pinterest embed type from the URL.
 *
 * @param {string} url The URL to check.
 * @returns {string} The pin type. Empty string if it isn't a valid Pinterest URL.
 */
export function pinType( url ) {
	if ( ! URL_REGEX.test( url ) ) {
		return '';
	}

	const path = getPath( url );

	if ( ! path ) {
		return '';
	}

	if ( path.startsWith( 'pin/' ) ) {
		return 'embedPin';
	}

	if ( path.match( /^([^/]+)\/?$/ ) ) {
		return 'embedUser';
	}

	if ( path.match( /^([^/]+)\/([^/]+)\/?$/ ) ) {
		return 'embedBoard';
	}

	return '';
}
