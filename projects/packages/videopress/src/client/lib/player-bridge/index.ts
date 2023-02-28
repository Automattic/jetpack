/**
 * Types
 */
import type { VideoGUID } from '../../block-editor/blocks/video/types';

type Origin = 'https://videopress.com' | 'https://video.wordpress.com';

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

type PlayerBrigeEventProps = {
	event: typeof VIDEOPRESS_ALLOWED_LISTENING_EVENTS[ number ];
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
	if ( ! VIDEOPRESS_ALLOWED_LISTENING_EVENTS.includes( eventName ) ) {
		return;
	}

	// Propagate only allowed origins.
	const allowed_origins: Array< Origin > = [
		'https://videopress.com',
		'https://video.wordpress.com',
	];

	if ( -1 === allowed_origins.indexOf( event.origin as Origin ) ) {
		return;
	}

	window.top.postMessage( event.data, '*' );
}

( function () {
	window.addEventListener( 'message', playerBridgeHandler );
} )();
