/**
 * Internal dependencies
 */
import { buildFilterAggregations } from '../../../modules/search/instant-search/lib/api';
import { SERVER_OBJECT_NAME } from '../../../modules/search/instant-search/lib/constants';
import store from '../../../modules/search/instant-search-gutenberg/store';
import { getSearchResults } from '../../../modules/search/instant-search-gutenberg/store/actions';
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {HTMLElement} block - DOM element
 */
const initializeBlock = function ( block ) {
	// eslint-disable-next-line no-console
	store.subscribe( () => console.log( 'SearchResults subscription:', store.getState() ) );
	store.dispatch(
		getSearchResults( {
			aggregations: buildFilterAggregations( [
				...window[ SERVER_OBJECT_NAME ].widgets,
				...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
			] ),
			query: 'hello',
			resultFormat: window[ SERVER_OBJECT_NAME ].overlayOptions.resultFormat,
			siteId: window[ SERVER_OBJECT_NAME ].siteId,
		} )
	);
	block.innerHTML = 'This is the search results block.';
	block.setAttribute( 'data-jetpack-block-initialized', 'true' );
};

document
	.querySelectorAll( '.wp-block-jetpack-search-results:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
