/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import store from '../../../modules/search/instant-search/store';
import SearchFilters from '../../../modules/search/instant-search/components/search-filters-fork';
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {HTMLElement} block - DOM element
 */
const initializeBlock = function ( block ) {
	render( <SearchFilters store={ store } />, block );
	block.setAttribute( 'data-jetpack-block-initialized', 'true' );
};

document
	.querySelectorAll( '.wp-block-jetpack-search-filters:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
