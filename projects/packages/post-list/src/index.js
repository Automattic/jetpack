/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';
import App from './components/app';

domReady( () => {
	// Data global containers.
	const posts = [ ...window.wpAdminPosts ];

	const rootElement = document.getElementById( 'wp-post-list-app' );

	posts.forEach( post => {
		const postRow = document.getElementById( 'post-' + post.id );
		if ( ! postRow ) {
			return;
		}

		const postTitleElementWrapper = postRow.querySelector( '.column-title' );

		// Inject post-featured-image__container container just before post title.
		const postFeaturedImageElement = document.createElement( 'span' );
		postFeaturedImageElement.classList.add( 'post-featured-image__container' );
		postFeaturedImageElement.classList.add(
			post.featured_image.id ? 'has-featured-image' : 'no-featured-image'
		);

		postTitleElementWrapper.insertBefore(
			postFeaturedImageElement,
			postTitleElementWrapper.firstChild
		);

		post.rootEl = postFeaturedImageElement;
	} );

	render( <App posts={ posts } />, rootElement );
} );
