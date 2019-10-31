/**
 * External dependencies
 */
import { getPath } from '@wordpress/url';

/**
 * Determines the Pinterest embed type from the URL.
 *
 * @param {string} url The URL to check.
 * @returns {string} The pin type.
 */
export function pinType( url ) {
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
