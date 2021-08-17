/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';
import Notice from './components/notice';

domReady( () => {
	const postRows = document.querySelectorAll( '.wp-list-table .entry' );
	if ( ! postRows?.length ) {
		return;
	}

	// Data global containers.
	const postIds = [];
	const posts = [];

	// Pick and organize data.
	postRows.forEach( postRow => {
		let postStatusLabelElement = postRow.querySelector( '.post-state' );
		const postTitleElementWrapper = postRow.querySelector( '.column-title' );
		const postDateElementWrapper = postRow.querySelector( '.column-date' );

		// Try to pick post data from custom column.
		let data;
		const rowDataContainer = postRow.querySelector(
			'.column-post-list-column script[type="application/json"]'
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
		// @TODO: probably it's better doing it in the server-side.
		postIds.push( data.id );

		/*
		 * Post status element might not exist.
		 * Let's create it when it happens.
		 */
		if ( ! postStatusLabelElement ) {
			const postTitleLabelElement = postRow.querySelector( '.row-title' );
			// Inject element when it doesn't exist (publish state).
			if ( postTitleLabelElement ) {
				postStatusLabelElement = document.createElement( 'span' );
				postStatusLabelElement.classList.add( 'post-state' );
				postTitleLabelElement.parentNode.insertBefore(
					postStatusLabelElement,
					postTitleLabelElement.nextSibling
				);
				postTitleLabelElement.parentNode.insertBefore(
					document.createTextNode( ' — ' ),
					postTitleLabelElement.nextSibling
				);
			}
		}

		// Inject post-feature-image container just before post title.
		const postFeatureImageElement = document.createElement( 'span' );
		postFeatureImageElement.classList.add( 'post-feature-image' );

		postTitleElementWrapper.insertBefore(
			postFeatureImageElement,
			postTitleElementWrapper.firstChild
		);

		posts.push( {
			data,
			elements: {
				title: postTitleElementWrapper,
				featureImage: postFeatureImageElement,
				statusLabel: postStatusLabelElement,
				postDate: postDateElementWrapper,
			},
		} );
	} );

	// Rendering components.

	// <Notice /> component.
	const noticePlaceholder = document.querySelector( '.post-list__notice-placeholder' );
	if ( noticePlaceholder ) {
		render( <Notice />, noticePlaceholder );
	}

	posts.forEach( ( { data, elements } ) => {
		// Starting to render UX components.
	} );
} );
