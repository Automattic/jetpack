/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from '../../../modules/search/instant-search/lib/constants';
import store from '../../../modules/search/instant-search-gutenberg/store';
import SearchResults from '../../../modules/search/instant-search/components/search-results-fork';
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {HTMLElement} block - DOM element
 */
const initializeBlock = function ( block ) {
	render(
		<SearchResults
			enableLoadOnScroll={ false }
			hasNextPage={ false }
			highlightColor={ window[ SERVER_OBJECT_NAME ].overlayOptions.highlightColor }
			isVisible
			locale={ window[ SERVER_OBJECT_NAME ].locale }
			onLoadNextPage={ () => null }
			query={ 'hello' }
			resultFormat={ window[ SERVER_OBJECT_NAME ].overlayOptions.resultFormat }
			store={ store }
		/>,
		block
	);
};

document
	.querySelectorAll( '.wp-block-jetpack-search-results:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
