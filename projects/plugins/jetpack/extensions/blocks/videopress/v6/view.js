/**
 * WordPress dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { VIDEO_AUTOPLAY_DURATION } from './constants';
import { rawBridgeScript } from './scripts/vp-block-bridge';
import dispatchPlayerAction from './utils/dispatcher';
import './style.scss';

const debug = debugFactory( 'jetpack:vpblock' );

// Define a debug instance for block bridge.
window.debugBridgeInstance = debugFactory( 'jetpack:vp-block:bridge' );

const BLOCK_CLASSNAME = 'wp-block-jetpack-videopress';

function debounce( fn, delay = 100 ) {
	let timer;
	return function ( event ) {
		if ( timer ) {
			clearTimeout( timer );
		}
		timer = setTimeout( fn, delay, event );
	};
}

function isFrameAccessible( iFrameDomRef ) {
	try {
		return !! iFrameDomRef.contentDocument.body;
	} catch ( e ) {
		debug( 'Error accessing iframe: ', e );
		return false;
	}
}

function tryToGetFeatures( domElement ) {
	try {
		return JSON.parse( domElement.dataset.features );
	} catch ( e ) {
		return debug( 'Error parsing features json: ', e );
	}
}

function tryToGetHTML( domElement ) {
	try {
		const html = JSON.parse( domElement.dataset.html );
		domElement.removeAttribute( 'data-html' );
		return html;
	} catch ( e ) {
		debug( 'error parsing html json: ', e );
		return;
	}
}

function setPlayerheight( wrapperElement, iFrame, ratio ) {
	iFrame.setAttribute( 'height', ( wrapperElement.offsetWidth * ratio ) / 100 );
}

function initVideoPressBlocks( blockDOMReference, clientId ) {
	debug( 'initializing block player %o', clientId );

	const features = tryToGetFeatures( blockDOMReference );
	if ( ! features ) {
		return;
	}

	const html = tryToGetHTML( blockDOMReference );
	if ( ! html ) {
		return;
	}

	const playerIFrame = blockDOMReference.querySelector( 'iframe' );
	if ( ! isFrameAccessible( playerIFrame ) ) {
		return;
	}

	const { contentDocument, ownerDocument, contentWindow } = playerIFrame;
	const { autoplayHovering, autoplayHoveringStart, videoRatio } = features;

	setPlayerheight( blockDOMReference, playerIFrame, videoRatio );

	const __html = '<div class="videopress-player-container">' + html + '</div>';

	const htmlDoc = `
		<html lang=${ ownerDocument.documentElement.lang }>
			<head>
				<title>${ ownerDocument.documentElement.title }</title>
				<style>body { margin: 0; padding: 0; border: 0; overflow: hidden; }</style>
			</head>
			<body>
				${ __html }
				<script type="text/javascript">
					${ rawBridgeScript }
				</script>
			</body>
		</html>
	`;

	contentDocument.open();
	contentDocument.write( '<!DOCTYPE html>' + htmlDoc );
	contentDocument.close();

	// Set the iframe height when resizing the window.
	contentWindow.addEventListener(
		'resize',
		debounce( function () {
			setPlayerheight( blockDOMReference, playerIFrame, videoRatio );
		} )
	);

	// Hack to set current time on the video.
	function positionatePlayer() {
		dispatchPlayerAction( playerIFrame, 'vpBlockActionSetCurrentTime', {
			currentTime: autoplayHoveringStart,
		} );
		dispatchPlayerAction( playerIFrame, 'vpBlockActionPause' );
		setTimeout( () => {
			// Auto clean up the listener.
			contentWindow.removeEventListener( 'onVideoPressPlaying', positionatePlayer );
		}, 0 );
	}

	function setInitialTime() {
		contentWindow.addEventListener( 'onVideoPressPlaying', positionatePlayer );

		// Hack: Play video to be able to set the current time.
		dispatchPlayerAction( playerIFrame, 'vpBlockActionPlay' );

		setTimeout( () => {
			// Once the video current time is set, clean up the listener.
			contentWindow.removeEventListener( 'onVideoPressLoadingState', setInitialTime );
		}, 0 );
	}
	// End of hack.

	blockDOMReference.setAttribute( 'data-jetpack-block-initialized', true );

	// Autoplay hovering feature.
	if ( autoplayHovering && playerIFrame ) {
		debug( 'adding autoplay hovering feature' );

		// When video is ready, set initial time position.
		contentWindow.addEventListener( 'onVideoPressLoadingState', setInitialTime );

		// Stop autoplay hovering after VIDEO_AUTOPLAY_DURATION seconds.
		contentWindow.addEventListener( 'onVideoPressTimeUpdate', event => {
			const { currentTime } = event.detail;
			if ( currentTime <= autoplayHoveringStart + VIDEO_AUTOPLAY_DURATION ) {
				return;
			}

			dispatchPlayerAction( playerIFrame, 'vpBlockActionPause' );
		} );

		blockDOMReference.addEventListener( 'mouseenter', () => {
			dispatchPlayerAction( playerIFrame, 'vpBlockActionPlay' );
		} );

		blockDOMReference.addEventListener( 'mouseleave', () => {
			dispatchPlayerAction( playerIFrame, 'vpBlockActionSetCurrentTime', {
				currentTime: autoplayHoveringStart,
			} );

			dispatchPlayerAction( playerIFrame, 'vpBlockActionPause' );
		} );
	}
}

document.onreadystatechange = function () {
	if ( document.readyState !== 'complete' ) {
		return;
	}

	const wpPlayerElements = document.querySelectorAll(
		`.${ BLOCK_CLASSNAME }:not([data-jetpack-block-initialized])`
	);

	if ( wpPlayerElements.length ) {
		wpPlayerElements.forEach( initVideoPressBlocks );
	}
};
