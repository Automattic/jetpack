/**
 * Internal dependencies
 */
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {string} id - The id of the block element in document.
 */
const initializeBlock = function ( block ) {
	block.innerHTML = 'This is the search filters block.';
	block.setAttribute( 'data-jetpack-block-initialized', 'true' );
};

document
	.querySelectorAll( '.wp-block-jetpack-search-filters:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
