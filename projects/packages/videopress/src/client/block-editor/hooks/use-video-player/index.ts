/**
 * External dependencies
 */
import debugFactory from 'debug';
import { useEffect, useRef, useState, useCallback } from 'react';
/**
 * Types
 */
import type { PlayerStateProp, UseVideoPlayerOptions, UseVideoPlayer } from './types';
import type React from 'react';

const debug = debugFactory( 'videopress:use-video-player' );

/**
 * Return the (content) Window object of the iframe,
 * given the iframe's ref.
 *
 * @param {React.MutableRefObject< HTMLDivElement >} iFrameRef - iframe ref
 * @returns {Window | null}	                                     Window object of the iframe
 */
export const getIframeWindowFromRef = (
	iFrameRef: React.MutableRefObject< HTMLDivElement >
): Window | null => {
	const iFrame: HTMLIFrameElement = iFrameRef?.current?.querySelector(
		'iframe.components-sandbox'
	);
	return iFrame?.contentWindow;
};

/**
 * Custom hook to set the player ready to use:
 *
 * @param {React.MutableRefObject< HTMLDivElement >} iFrameRef - useRef of the sandbox wrapper.
 * @param {boolean} isRequestingPreview                        - Whether the preview is being requested.
 * @param {UseVideoPlayerOptions} options                      - Options object.
 * @returns {UseVideoPlayer}                                     playerIsReady and playerState
 */
const useVideoPlayer = (
	iFrameRef: React.MutableRefObject< HTMLDivElement >,
	isRequestingPreview: boolean,
	{ autoplay, initialTimePosition, wrapperElement, previewOnHover }: UseVideoPlayerOptions
): UseVideoPlayer => {
	const [ playerIsReady, setPlayerIsReady ] = useState( false );
	const playerState = useRef< PlayerStateProp >( 'not-rendered' );

	/**
	 * Handler function that listen the events
	 * emited by the player client.
	 *
	 * - Initial player state:
	 * - - Detect the "videopress_loading_state" state.
	 * - - Detect the first time the player plays.
	 * - - Stop right after it plays.
	 * - - Set the player position at the desired time.
	 *
	 * @param {MessageEvent} event - Message event
	 */
	function listenEventsHandler( event: MessageEvent ) {
		const { data: eventData = {}, source } = event;
		const { event: eventName } = event?.data || {};

		// Detect when the video has been loaded.
		if ( eventName === 'videopress_loading_state' && eventData.state === 'loaded' ) {
			debug( 'state: loaded' );
			playerState.current = 'loaded';
		}

		// Detect when the video has been played for the first time.
		if ( eventName === 'videopress_playing' && playerState.current === 'loaded' ) {
			playerState.current = 'first-play';
			debug( 'state: first-play detected' );

			// Pause the video only if the autoplay is disabled.
			if ( autoplay ) {
				debug( 'autoplay enabled. Do not pause' );
			} else {
				debug( 'pause video' );
				source.postMessage( { event: 'videopress_action_pause' }, { targetOrigin: '*' } );
			}

			// Set position at time if it was provided.
			if ( typeof initialTimePosition !== 'undefined' ) {
				debug( 'set position at time %o ', initialTimePosition );
				source.postMessage(
					{ event: 'videopress_action_set_currenttime', currentTime: initialTimePosition / 1000 },
					{ targetOrigin: '*' }
				);
			}

			// Here we consider the video as ready to be controlled.
			setPlayerIsReady( true );
			playerState.current = 'ready';
		}
	}

	// Listen player events.
	useEffect( () => {
		if ( isRequestingPreview ) {
			return;
		}

		const sandboxIFrameWindow = getIframeWindowFromRef( iFrameRef );
		if ( ! sandboxIFrameWindow ) {
			return;
		}

		sandboxIFrameWindow.addEventListener( 'message', listenEventsHandler );

		return () => {
			// Remove the listener when the component is unmounted.
			sandboxIFrameWindow.removeEventListener( 'message', listenEventsHandler );
		};
	}, [ iFrameRef, isRequestingPreview ] );

	const play = useCallback( () => {
		const sandboxIFrameWindow = getIframeWindowFromRef( iFrameRef );
		if ( ! sandboxIFrameWindow || ! playerIsReady ) {
			return;
		}

		sandboxIFrameWindow.postMessage( { event: 'videopress_action_play' }, '*' );
	}, [ iFrameRef, playerIsReady ] );

	const stop = useCallback( () => {
		const sandboxIFrameWindow = getIframeWindowFromRef( iFrameRef );
		if ( ! sandboxIFrameWindow || ! playerIsReady ) {
			return;
		}

		sandboxIFrameWindow.postMessage( { event: 'videopress_action_pause' }, '*' );
	}, [ iFrameRef, playerIsReady ] );

	// PreviewOnHover feature.
	const isPreviewOnHoverEnabled = !! previewOnHover;
	useEffect( () => {
		if ( ! wrapperElement || ! isPreviewOnHoverEnabled ) {
			return;
		}

		wrapperElement.addEventListener( 'mouseenter', play );
		wrapperElement.addEventListener( 'mouseleave', stop );

		return () => {
			// Remove the listener when the component is unmounted.
			wrapperElement.removeEventListener( 'mouseenter', play );
			wrapperElement.removeEventListener( 'mouseleave', stop );
		};
	}, [ isPreviewOnHoverEnabled, wrapperElement, playerIsReady ] );

	return {
		playerIsReady,
	};
};

export default useVideoPlayer;
