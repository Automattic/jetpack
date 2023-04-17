/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
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
 * @param {Function} onTimeUpdate                              - Callback function to be called when the time is updated.
 * @returns {UseVideoPlayer}                                     playerIsReady and playerState
 */
const useVideoPlayer = (
	iFrameRef: React.MutableRefObject< HTMLDivElement >,
	isRequestingPreview: boolean,
	{ autoplay, initialTimePosition, wrapperElement, previewOnHover }: UseVideoPlayerOptions,
	onTimeUpdate?: ( currentTime: number ) => void
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

		if ( eventName === 'videopress_timeupdate' ) {
			const currentTime = eventData.currentTimeMs;
			onTimeUpdate?.( currentTime );

			if ( previewOnHover ) {
				const startLimit = previewOnHover.atTime;
				const endLimit = previewOnHover.atTime + previewOnHover.duration;
				if (
					currentTime < startLimit || // Before the start limit.
					currentTime > endLimit // After the end limit.
				) {
					source.postMessage(
						{ event: 'videopress_action_set_currenttime', currentTime: startLimit / 1000 },
						{ targetOrigin: '*' }
					);
				}
			}
		}
	}

	// PreviewOnHover feature.
	const isPreviewOnHoverEnabled = !! previewOnHover;
	const wasPreviewOnHoverEnabled = usePrevious( isPreviewOnHoverEnabled );
	const wasPreviewOnHoverJustEnabled = isPreviewOnHoverEnabled && ! wasPreviewOnHoverEnabled;

	const sandboxIFrameWindow = getIframeWindowFromRef( iFrameRef );

	// Listen player events.
	useEffect( () => {
		if ( ! sandboxIFrameWindow ) {
			return;
		}

		if ( isRequestingPreview ) {
			return;
		}

		debug( 'player is ready to listen events' );
		sandboxIFrameWindow.addEventListener( 'message', listenEventsHandler );

		return () => {
			// Remove the listener when the component is unmounted.
			sandboxIFrameWindow.removeEventListener( 'message', listenEventsHandler );
		};
	}, [ sandboxIFrameWindow, isRequestingPreview, wasPreviewOnHoverJustEnabled, previewOnHover ] );

	const play = useCallback( () => {
		if ( ! sandboxIFrameWindow || ! playerIsReady ) {
			return;
		}

		sandboxIFrameWindow.postMessage( { event: 'videopress_action_play' }, '*' );
	}, [ iFrameRef, playerIsReady, sandboxIFrameWindow ] );

	const pause = useCallback( () => {
		if ( ! sandboxIFrameWindow || ! playerIsReady ) {
			return;
		}

		sandboxIFrameWindow.postMessage( { event: 'videopress_action_pause' }, '*' );
	}, [ iFrameRef, playerIsReady, sandboxIFrameWindow ] );

	useEffect( () => {
		if ( ! wrapperElement || ! isPreviewOnHoverEnabled ) {
			return;
		}

		wrapperElement.addEventListener( 'mouseenter', play );
		wrapperElement.addEventListener( 'mouseleave', pause );

		return () => {
			// Remove the listener when the component is unmounted.
			wrapperElement.removeEventListener( 'mouseenter', play );
			wrapperElement.removeEventListener( 'mouseleave', pause );
		};
	}, [ isPreviewOnHoverEnabled, wrapperElement, playerIsReady ] );

	// Move the video to the "Starting point" when it changes.
	useEffect( () => {
		if ( ! playerIsReady || ! previewOnHover ) {
			return;
		}

		if ( ! sandboxIFrameWindow ) {
			return;
		}

		sandboxIFrameWindow.postMessage(
			{ event: 'videopress_action_set_currenttime', currentTime: previewOnHover.atTime / 1000 },
			{ targetOrigin: '*' }
		);
	}, [ previewOnHover?.atTime, playerIsReady, sandboxIFrameWindow ] );

	// Move the video to the "duration" when it changes.
	useEffect( () => {
		if ( ! playerIsReady || ! previewOnHover ) {
			return;
		}

		if ( ! sandboxIFrameWindow ) {
			return;
		}

		sandboxIFrameWindow.postMessage(
			{
				event: 'videopress_action_set_currenttime',
				currentTime: ( previewOnHover.atTime + previewOnHover.duration ) / 1000,
			},
			{ targetOrigin: '*' }
		);
	}, [ previewOnHover?.duration, playerIsReady, sandboxIFrameWindow ] );

	return {
		playerIsReady,
		play,
		pause,
	};
};

export default useVideoPlayer;
