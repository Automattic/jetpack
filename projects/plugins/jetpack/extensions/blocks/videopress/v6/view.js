/**
 * WordPress dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { VIDEO_AUTOPLAY_DURATION } from './constants';
import dispatchPlayerAction from './utils/dispatcher';
import './style.scss';

const debug = debugFactory( 'jetpack:vpblock' );
const BLOCK_CLASSNAME = 'wp-block-jetpack-videopress';

const _video_instances = {
	items: {},
	current: null,
};

function tryToGetFeatures( domElement ) {
	try {
		return JSON.parse( domElement.dataset.features );
	} catch ( e ) {
		debug( 'error parsing json', e );
		return;
	}
}

function initVideoPressBlocks( blockDOMReference ) {
	debug( 'initializing block instance' );
	const playerIFrame = blockDOMReference.querySelector( 'iframe' );
	if ( ! playerIFrame ) {
		return;
	}

	const features = tryToGetFeatures( blockDOMReference );
	if ( ! features ) {
		return;
	}

	const { autoplayHovering, autoplayHoveringStart, guid } = features;
	const instanceId = `vpblock-${ Object.keys( _video_instances.items ).length }-${ guid }`;
	_video_instances.items = {
		..._video_instances.items,
		[ instanceId ]: features,
	};

	blockDOMReference.setAttribute( 'data-jetpack-block-initialized', instanceId );
	debug( '%o initialized', instanceId );

	// Autoplay hover feature.
	if ( autoplayHovering && playerIFrame ) {
		debug( 'adding autoplay hover feature' );

		window.addEventListener( 'message', event => {
			if ( ! _video_instances.current ) {
				return;
			}

			const { data } = event;
			if ( ! [ 'videopress_timeupdate' ].includes( data?.event ) ) {
				return;
			}

			const currentFeatures = _video_instances.items[ _video_instances.current ];
			if ( ! currentFeatures ) {
				return;
			}

			const { autoplayHoveringStart: currentStartTime } = currentFeatures;
			const countDown =
				data?.currentTime && currentStartTime + VIDEO_AUTOPLAY_DURATION - data.currentTime;

			if ( data.event === 'videopress_timeupdate' && ! countDown ) {
				return dispatchPlayerAction( playerIFrame, 'videopress_action_pause' );
			}
		} );

		// Add the autoplay hover feature.
		blockDOMReference.addEventListener( 'mouseenter', event => {
			_video_instances.current = event.target.dataset.jetpackBlockInitialized;

			dispatchPlayerAction( playerIFrame, 'videopress_action_set_currenttime', {
				currentTime: autoplayHoveringStart,
			} );
			dispatchPlayerAction( playerIFrame, 'videopress_action_play' );
		} );

		blockDOMReference.addEventListener( 'mouseleave', () => {
			_video_instances.current = null;

			dispatchPlayerAction( playerIFrame, 'videopress_action_set_currenttime', {
				currentTime: autoplayHoveringStart,
			} );
			dispatchPlayerAction( playerIFrame, 'videopress_action_pause' );
		} );
	}
}

document.onreadystatechange = function () {
	if ( document.readyState !== 'complete' ) {
		return;
	}

	debug( 'init' );

	const instances = document.querySelectorAll(
		`.${ BLOCK_CLASSNAME }:not([data-jetpack-block-initialized])`
	);

	if ( instances.length ) {
		instances.forEach( initVideoPressBlocks );
	}

	const instancesDos = document.querySelectorAll(
		`.${ BLOCK_CLASSNAME }:not([data-jetpack-block-initialized])`
	);

	if ( instancesDos.length ) {
		instancesDos.forEach( initVideoPressBlocks );
	}
};
