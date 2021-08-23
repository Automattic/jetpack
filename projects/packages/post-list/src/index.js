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
import FeaturedImage from './components/featured-image';

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

		// Inject post-featured-image__container container just before post title.
		const postFeaturedImageElement = document.createElement( 'span' );
		postFeaturedImageElement.classList.add( 'post-featured-image__container' );

		postTitleElementWrapper.insertBefore(
			postFeaturedImageElement,
			postTitleElementWrapper.firstChild
		);

		posts.push( {
			data,
			elements: {
				title: postTitleElementWrapper,
				featuredImage: postFeaturedImageElement,
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

	// Starting to render UX components.
	posts.forEach( ( { data, elements } ) => {
		// <FeaturedImage /> component.
		elements.featuredImage.classList.add(
			data.featured_image.id ? 'has-featured-image' : 'no-featured-image'
		);
		render(
			<FeaturedImage { ...data.featured_image } postId={ data?.id } />,
			elements.featuredImage
		);
	} );
} );
