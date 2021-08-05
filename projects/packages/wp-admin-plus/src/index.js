/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';
import PostDate from './components/post-date';

domReady( () => {
	const postRows = document.querySelectorAll( '.wp-list-table .entry' );
	if ( ! postRows?.length ) {
		return;
	}

	postRows.forEach( postRow => {
		// Row data
		const rowDataContainer = postRow.querySelector(
			'.column-wp-admin-plus-column script[type="application/json"]'
		);
		const postDateElement = postRow.querySelector( '.column-date' );
		const fallbackText = postDateElement.innerText;

		let data;
		try {
			data = JSON.parse( rowDataContainer.text );
		} catch ( e ) {
			// @TODO: improve error handling.
			// eslint-disable-next-line no-console
			return console.error( 'error parsing json', e );
		}

		// clean data element.
		if ( data ) {
			rowDataContainer.remove();
		}

		render( <PostDate { ...data } fallbackText={ fallbackText } />, postDateElement );
	} );
} );
