import { createBlock } from '@wordpress/blocks';
import { renderToString } from '@wordpress/element';

/**
 * Fallback behaviour for unembeddable URLs.
 * Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 *
 * @param {string}   url       - The URL that could not be embedded.
 * @param {Function} onReplace - Function to call with the created fallback block.
 */
export function convertToLink( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace( createBlock( 'core/paragraph', { content: renderToString( link ) } ) );
}

/**
 * Extracts an event id from an Eventbrite URL.
 *
 * @param   {string}  url - Eventbrite URL.
 * @returns {?number}     - Event id.
 */
export function eventIdFromUrl( url ) {
	if ( ! url ) {
		return null;
	}

	const match = url.match( /(\d+)\/?(?:\?[^\/]*)?\s*$/ );
	return match && match[ 1 ] ? parseInt( match[ 1 ], 10 ) : null;
}

/**
 * Returns a normalized URL string from raw input. For now we're just trimming to avoid broken URLs.
 *
 * @param   {string}  url - Eventbrite URL string.
 * @returns {?string}     - Normalized string.
 */
export function normalizeUrlInput( url = '' ) {
	if ( ! url || typeof url !== 'string' ) {
		return null;
	}

	return url.trim();
}
