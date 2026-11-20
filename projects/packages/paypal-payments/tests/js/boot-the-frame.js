/**
 * Boot the stacked preview's SDK frame, for the tests that read what lands inside it.
 *
 * jsdom never fetches the frame, so the document it ends up with is never one boot() can
 * use: about:blank with no `location.host` where nothing set the src, a navigated document
 * with no body where something did. The helper hands it a document and a window carrying
 * a host and a ResizeObserver, then fires the load. That document has no stylesheet; the
 * PHP tests cover the `flow-root` rule the container is measured under.
 *
 * @package
 */

import { fireEvent, screen } from '@testing-library/react';

/**
 * Give the frame a document with a host, then fire the load boot() listens for.
 *
 * @param {string} [baseUrl] - The page the frame's document sits on, so an injected URL
 *                           resolves against it.
 * @return {object} The frame's window and document, and the nodes the ResizeObserver watches.
 */
export default function bootTheFrame( baseUrl ) {
	const doc = document.implementation.createHTMLDocument( '' );
	const observed = [];
	const win = {
		location: { host: 'example.test' },
		ResizeObserver: class {
			constructor( callback ) {
				this.callback = callback;
			}
			observe( node ) {
				observed.push( { node, resize: this.callback } );
			}
		},
	};

	if ( baseUrl ) {
		const base = doc.createElement( 'base' );
		base.setAttribute( 'href', baseUrl );
		doc.head.appendChild( base );
	}

	const el = screen.getByTitle( 'PayPal buttons preview' );
	Object.defineProperty( el, 'contentWindow', { value: win, configurable: true } );
	Object.defineProperty( el, 'contentDocument', { value: doc, configurable: true } );
	fireEvent.load( el );

	return { doc, observed, win };
}
