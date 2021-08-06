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
import PostDate from './components/post-date/';

domReady( () => {
	const postRows = document.querySelectorAll( '.wp-list-table .entry' );
	if ( ! postRows?.length ) {
		return;
	}

	const postIds = [];
	postRows.forEach( postRow => {
		const postDateElementWrapper = postRow.querySelector( '.column-date' );
		const fallbackText = postDateElementWrapper.innerText;

		// Try to pick post data from custom column.
		let data;
		const rowDataContainer = postRow.querySelector(
			'.column-wp-admin-plus-column script[type="application/json"]'
		);
		try {
			data = JSON.parse( rowDataContainer.text );
		} catch ( e ) {
			// @TODO: improve error handling.
			// eslint-disable-next-line no-console
			return console.error( 'error parsing json: ', e );
		}

		// Clean data-container element.
		if ( data ) {
			rowDataContainer.remove();
		}

		// Collect all post ids in the current admin page.
		postIds.push( data.id );

		// Render a component for each post row.
		render(
			<PostDate { ...data } fallbackText={ fallbackText } postIds={ postIds } />,
			postDateElementWrapper
		);
	} );
} );
