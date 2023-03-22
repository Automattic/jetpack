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

const VIDEOPRESS_ALLOWED_EMITTING_EVENTS = [
	'videopress_action_play',
	'videopress_action_pause',
	'videopress_action_set_currenttime',
	'videopress_action_set_volume',
] as const;

type PlayerBrigeEventProps = {
	event: typeof VIDEOPRESS_ALLOWED_EMITTING_EVENTS[ number ];
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
