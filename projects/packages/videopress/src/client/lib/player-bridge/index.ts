/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Types
 */
import { VideoPressApiIframeInstance } from '../../block-editor/global';
import type { VideoGUID } from '../../block-editor/blocks/video/types';

type Origin = 'https://videopress.com' | 'https://video.wordpress.com';

const debug = debugFactory( 'videopress:player-bridge' );

declare global {
	interface Window {
		iframeApiInstance: VideoPressApiIframeInstance;
	}
}

const VIDEOPRESS_ALLOWED_LISTENING_EVENTS = [
	'videopress_playing',
	'videopress_pause',
	'videopress_seeking',
	'videopress_resize',
	'videopress_volumechange',
	'videopress_ended',
	'videopress_timeupdate',
	'videopress_durationchange',
	'videopress_progress',
	'videopress_loading_state',
	'videopress_toggle_fullscreen',
] as const;

const VIDEOPRESS_ALLOWED_EMITTING_EVENTS = [
	'videopress_action_play',
	'videopress_action_pause',
	'videopress_action_set_currenttime',
	'videopress_action_set_volume',
	'videopress_action_set_mute',
] as const;

type VideoPressEvent =
	| ( typeof VIDEOPRESS_ALLOWED_LISTENING_EVENTS )[ number ]
	| ( typeof VIDEOPRESS_ALLOWED_EMITTING_EVENTS )[ number ];

type PlayerBrigeEventProps = {
	event: VideoPressEvent;
	id: VideoGUID;
	origin: Origin;
	muted: boolean;
};

/**
 * Check if the event is allowed to be listened.
 *
 * @param {VideoPressEvent} event - The event name
 * @returns {boolean} 		 	  - Whether the event is allowed to be listened
 */
function isListeningEvent(
	event: VideoPressEvent
): event is ( typeof VIDEOPRESS_ALLOWED_LISTENING_EVENTS )[ number ] {
	return VIDEOPRESS_ALLOWED_LISTENING_EVENTS.includes(
		event as ( typeof VIDEOPRESS_ALLOWED_LISTENING_EVENTS )[ number ]
	);
}

/**
 * Check if the event is allowed to be emitted.
 *
 * @param {VideoPressEvent} event - The event name
 * @returns {boolean} 		 	  - Whether the event is allowed to be listened
 */
function isEmittingEvent(
	event: VideoPressEvent
): event is ( typeof VIDEOPRESS_ALLOWED_EMITTING_EVENTS )[ number ] {
	return VIDEOPRESS_ALLOWED_EMITTING_EVENTS.includes(
		event as ( typeof VIDEOPRESS_ALLOWED_EMITTING_EVENTS )[ number ]
	);
}

/**
 * Function handler to dialog between
 * the client (player) and the app (editor)
 *
 * @param {object} event - The event object
 */
export async function playerBridgeHandler(
	event: MessageEvent< PlayerBrigeEventProps >
): Promise< void > {
	const data = event.data;
	const eventName = data.event;

	// const { data = { event: null }, origin } = event;
	// const { event: eventName } = data;

	// Propagate only allowed events.
	if ( isListeningEvent( eventName ) ) {
		// Propagate only allowed origins.
		const allowed_origins: Array< Origin > = [
			'https://videopress.com',
			'https://video.wordpress.com',
		];

		if ( -1 !== allowed_origins.indexOf( origin as Origin ) ) {
			debug( 'broadcast %o event: %o', eventName, data );
			window.top.postMessage( data, '*' );
		}
	}

	if ( isEmittingEvent( eventName ) ) {
		const videoPressIFrame = document.querySelector( 'iframe' );
		const videoPressWindow = videoPressIFrame?.contentWindow;
		if ( ! videoPressWindow ) {
			return;
		}

		debug( 'emit %o event - %o', eventName, data );
		videoPressWindow.postMessage( data, '*' );

		if ( ! window?.iframeApiInstance ) {
			return;
		}

		const iframeApiInstance = window.iframeApiInstance;

		if ( eventName === 'videopress_action_set_mute' ) {
			iframeApiInstance.controls.mute( data.muted );
		}
	}
}

( function () {
	window.addEventListener( 'DOMContentLoaded', function () {
		const videoPressIFrameElement = document.querySelector( 'iframe' );

		// Check whether the IFrame API is available
		if ( ! videoPressIFrameElement || ! window?.VideoPressIframeApi ) {
			return window.addEventListener( 'message', playerBridgeHandler );
		}

		/*
		 * Create an instance of the VideoPressIframeApi,
		 * store it in the global scope and add a listener,
		 * and then add a listener to the window message event.
		 * This is to ensure that the VideoPressIframeApi is
		 * available before the message event is fired.
		 */
		window.iframeApiInstance = window.VideoPressIframeApi( videoPressIFrameElement, function () {
			window.addEventListener( 'message', playerBridgeHandler );
		} );
	} );
} )();
