/**
 * Internal dependencies
 */
import store from '../../../modules/search/instant-search-gutenberg/store';
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {HTMLElement} block - DOM element
 */
const initializeBlock = function ( block ) {
	// eslint-disable-next-line no-console
	store.subscribe( () => console.log( 'SearchFilters subscription:', store.getState() ) );
	block.innerHTML = 'This is the search filters block.';
	block.setAttribute( 'data-jetpack-block-initialized', 'true' );
};

document
	.querySelectorAll( '.wp-block-jetpack-search-filters:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
