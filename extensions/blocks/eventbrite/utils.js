/**
 * External dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Fallback behaviour for unembeddable URLs.
 * Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 *
 * @param {string}   url       The URL that could not be embedded.
 * @param {Function} onReplace Function to call with the created fallback block.
 */
export function convertToLink( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace( createBlock( 'core/paragraph', { content: renderToString( link ) } ) );
}

/**
 * Extracts an event id from an Eventbrite URL.
 *
 * @param   {string} url Eventbrite URL.
 * @returns {string}     Event id.
 */
export function eventIdFromUrl( url ) {
	if ( ! url ) {
		return null;
	}

	const match = url.match( /(\d+)\/?\s*$/ );
	return match && match[ 1 ] ? parseInt( match[ 1 ], 10 ) : null;
}

/**
 * Creates an html id used to identify an embedded Eventbrite widget.
 *
 * @param   {string} eventId Event id.
 * @returns {string}         HTML id.
 */
export function createWidgetId( eventId ) {
	return `${ window.Jetpack_Block_Eventbrite_Settings.widget_slug }-${ eventId }`;
}
