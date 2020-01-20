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
export function fallback( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace( createBlock( 'core/paragraph', { content: renderToString( link ) } ) );
}

export function eventIdFromUrl( url ) {
	const regex = new RegExp( window.Jetpack_Block_Eventbrite_Settings.event_id_from_url_regex );
	const match = url.match( regex );
	return match && match[ 1 ] ? match[ 1 ] : null;
}

export function createWidgetId( eventId ) {
	return `${ window.Jetpack_Block_Eventbrite_Settings.widget_slug }-${ eventId }`;
}
