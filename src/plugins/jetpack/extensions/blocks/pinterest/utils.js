/**
 * External dependencies
 */
import { getPath } from '@wordpress/url';
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
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

/**
 * Fallback behaviour for unembeddable URLs.
 * Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 *
 * @param {string}   url       The URL that could not be embedded.
 * @param {Function} onReplace Function to call with the created fallback block.
 */
export function fallback( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace( createBlock( 'core/paragraph', { content: renderToString( link ) } ) );
}
