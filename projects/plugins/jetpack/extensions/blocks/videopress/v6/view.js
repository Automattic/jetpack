/**
 * WordPress dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import dispatchPlayerAction from './utils/dispatcher';
import './style.scss';

const debug = debugFactory( 'jetpack:vpblock' );
const BLOCK_CLASSNAME = 'wp-block-jetpack-videopress';

function initVideoPressBlocks( blockDOMReference ) {
	debug( 'initializing block instance', blockDOMReference );

	// Block initialized flag.
	blockDOMReference.setAttribute( 'data-jetpack-block-initialized', 'true' );

	let features;
	try {
		features = JSON.parse( blockDOMReference.dataset.features );
		debug( 'features', features );
	} catch ( e ) {
		debug( 'error parsing json', e );
	}

	if ( ! features ) {
		return;
	}

	const { autoplayHovering, autoplayHoveringStart, autoplayHoveringDuration } = features;

	// Autoplay hover feature.
	const playerIFrame = blockDOMReference.querySelector( 'iframe' );
	if ( autoplayHovering && playerIFrame ) {
		debug( 'adding autoplay hover feature' );

		// Add the autoplay hover feature.
		blockDOMReference.addEventListener( 'mouseenter', () => {
			const currentTime = autoplayHoveringStart + autoplayHoveringDuration;
			dispatchPlayerAction( playerIFrame, 'videopress_action_set_currenttime', {
				currentTime,
			} );
			dispatchPlayerAction( playerIFrame, 'videopress_action_play' );
		} );

		blockDOMReference.addEventListener( 'mouseleave', () => {
			dispatchPlayerAction( playerIFrame, 'videopress_action_pause' );
		} );
	}
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
