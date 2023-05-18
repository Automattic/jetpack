/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Types
 */
import type { VideoGUID } from '../../block-editor/blocks/video/types';

type Origin = 'https://videopress.com' | 'https://video.wordpress.com';

const debug = debugFactory( 'videopress:player-bridge' );

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
] as const;

type PlayerBrigeEventProps = {
	event: ( typeof VIDEOPRESS_ALLOWED_LISTENING_EVENTS )[ number ];
	id: VideoGUID;
	origin: Origin;
};

/**
 * Function handler to dialog between
 * the client (player) and the app (editor)
 *
 * @param {object} event - The event object
 */
export async function playerBridgeHandler(
	event: MessageEvent< PlayerBrigeEventProps >
): Promise< void > {
	const { data = { event: null } } = event || {};
	const { event: eventName } = data;

	// Propagate only allowed events.
	if ( VIDEOPRESS_ALLOWED_LISTENING_EVENTS.includes( eventName ) ) {
		// Propagate only allowed origins.
		const allowed_origins: Array< Origin > = [
			'https://videopress.com',
			'https://video.wordpress.com',
		];

		if ( -1 !== allowed_origins.indexOf( event.origin as Origin ) ) {
			debug( 'broadcast %o event: %o', eventName, data );
			window.top.postMessage( event.data, '*' );
		}
	}

	if ( VIDEOPRESS_ALLOWED_EMITTING_EVENTS.includes( eventName ) ) {
		const videoPressIFrame = document.querySelector( 'iframe' );
		const videoPressWindow = videoPressIFrame?.contentWindow;
		if ( ! videoPressWindow ) {
			return;
		}

		debug( 'emit %o event - %o', eventName, data );
		videoPressWindow.postMessage( data, '*' );
	}
}

( function () {
	window.addEventListener( 'message', playerBridgeHandler );
} )();
