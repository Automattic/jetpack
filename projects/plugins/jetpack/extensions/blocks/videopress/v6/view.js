/**
 * WordPress dependencies
 */
import debugFactory from 'debug';
const debug = debugFactory( 'jetpack:vpblock' );

/**
 * Internal dependencies
 */
import './style.scss';

const BLOCK_CLASSNAME = 'wp-block-jetpack-videopress';

function initVideoPressBlocks( blockDOMReference ) {
	debug( 'initializing block instance', blockDOMReference );

	// Block initialized flag.
	blockDOMReference.setAttribute( 'data-jetpack-block-initialized', 'true' );
}

document.addEventListener( 'DOMContentLoaded', function () {
	// eslint-disable-next-line no-console
	debug( 'init' );

	const instances = document.querySelectorAll(
		`.${ BLOCK_CLASSNAME }:not([data-jetpack-block-initialized])`
	);

	if ( instances.length ) {
		instances.forEach( initVideoPressBlocks );
	}
} );
