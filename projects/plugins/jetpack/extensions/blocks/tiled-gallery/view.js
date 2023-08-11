import domReady from '@wordpress/dom-ready';
import './view.scss';
import ResizeObserver from 'resize-observer-polyfill';
import { handleRowResize } from './layout/mosaic/resize';

/**
 * Handler for Gallery ResizeObserver
 *
 * @param {Array<ResizeObserverEntry>} galleries - Resized galleries
 */
function handleObservedResize( galleries ) {
	if ( handleObservedResize.pendingRaf ) {
		cancelAnimationFrame( handleObservedResize.pendingRaf );
	}
	handleObservedResize.pendingRaf = requestAnimationFrame( () => {
		handleObservedResize.pendingRaf = null;
		for ( const gallery of galleries ) {
			const { width: galleryWidth } = gallery.contentRect;
			// We can't use childNodes because post content may contain unexpected text nodes
			const rows = Array.from( gallery.target.querySelectorAll( '.tiled-gallery__row' ) );
			rows.forEach( row => handleRowResize( row, galleryWidth ) );
		}
	} );
}

/**
 * Get all the galleries on the document
 *
 * @returns {Array} List of gallery nodes
 */
function getGalleries() {
	return Array.from(
		document.querySelectorAll(
			'.wp-block-jetpack-tiled-gallery.is-style-rectangular > .tiled-gallery__gallery,' +
				'.wp-block-jetpack-tiled-gallery.is-style-columns > .tiled-gallery__gallery'
		)
	);
}

/**
 * Setup ResizeObserver to follow each gallery on the page
 */
const observeGalleries = () => {
	const galleries = getGalleries();

	if ( galleries.length === 0 ) {
		return;
	}

	const observer = new ResizeObserver( handleObservedResize );

	galleries.forEach( gallery => {
		if ( gallery.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
			return;
		}

		observer.observe( gallery );
		gallery.setAttribute( 'data-jetpack-block-initialized', 'true' );
	} );
};

if ( typeof window !== 'undefined' ) {
	domReady( observeGalleries );
}
