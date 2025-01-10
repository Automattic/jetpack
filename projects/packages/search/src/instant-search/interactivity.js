import './components/search-app.scss';
import './components/gridicon/style.scss';
import './components/jetpack-colophon.scss';
import './components/notice.scss';
import './components/overlay.scss';
import './components/path-breadcrumbs.scss';
import './components/product-price.scss';
import './components/product-ratings.scss';
import './components/scroll-button.scss';
import './components/search-box.scss';
import './components/search-controls.scss';
import './components/search-filters.scss';
import './components/search-result-comments.scss';
import './components/search-result-expanded.scss';
import './components/search-result-minimal.scss';
import './components/search-result-product.scss';
import './components/search-result.scss';
import './components/search-results.scss';
import './components/search-sort.scss';
import './components/sidebar.scss';
import './components/tabbed-search-filters.scss';
import './components/widget-area-container.scss';

import * as iAPI from '@wordpress/interactivity';

/* eslint-disable jsdoc/require-yields */

const DEBOUNCE_TIMEOUT = 300;

/** @type {WeakMap<()=>void, AbortController>} */
const debounceMap = new WeakMap();

console.log( iAPI.getConfig( 'jetpack/instant-search' ).options );
const store = iAPI.store( 'jetpack/instant-search', {
	/**
	 * Handle search input.
	 *
	 * @param {InputEvent} e - Input event.
	 */
	*onSearchInput( e ) {
		const Router = yield import( '@wordpress/interactivity-router' ).catch( () => undefined );
		if ( ! Router ) {
			console.log( 'no router' );
			return;
		}

		console.log( '%o', Router );

		/** @type {string} */
		const val = e.target.value;
		console.log( '%o', val );

		debounceMap.get( store.onSearchInput )?.abort( 'debounced' );
		const abortController = new AbortController();
		debounceMap.set( store.onSearchInput, abortController );
		try {
			yield new Promise( ( resolve, reject ) => {
				const t = setTimeout( resolve, DEBOUNCE_TIMEOUT );
				abortController.signal.addEventListener( 'abort', () => {
					clearInterval( t );
					reject( abortController.signal.reason );
				} );
			} );
		} catch ( err ) {
			if ( e === 'debounced' ) {
				return;
			}
			throw e;
		}

		const u = new URL( document.location.href );
		u.searchParams.set( 's', val );

		yield Router.actions.navigate( u.href );
	},
} );
