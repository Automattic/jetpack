/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Types
 */
import getMediaToken from '../get-media-token';
import type { VideoGUID } from '../../block-editor/blocks/video/types';

const debug = debugFactory( 'videopress:token-bridge' );

type VideopressAjaxPostMessageEventProps = {
	event: 'videopress_token_request_ack' | 'videopress_token_received' | 'videopress_token_error';
	guid: VideoGUID;
	requestId: string;
	jwt?: string;
};

type Origin = 'https://videopress.com' | 'https://video.wordpress.com';

const { videopressAjax } = window;

type TokenBrigeEventProps = {
	event: 'videopress_token_request';
	guid: VideoGUID;
	requestId: string;
	origin: Origin;
};

const requestToken = { attempt: 0, isRequesting: false };

/**
 * Function handler to dialog with the client
 * (token requester) and the app
 * to provide a JWT on demand.
 *
 * @param {object} event - The event object
 */
export async function tokenBridgeHandler(
	event: MessageEvent< TokenBrigeEventProps >
): Promise< void > {
	if ( event.data?.event !== 'videopress_token_request' ) {
		return;
	}

	if ( ! videopressAjax ) {
		debug( '(%s) videopressAjax is not accesible' );
		return;
	}

	const { context = 'main' } = videopressAjax;
	if ( requestToken.isRequesting ) {
		debug( '(%s) Request already in progress', context );
		return;
	}

	const { guid, requestId } = event.data;
	if ( ! guid || ! requestId ) {
		debug( '(%s) Invalid request', context );
		return;
	}

	const postId = window?.videopressAjax.post_id || 0;

	const allowed_origins: Array< Origin > = [
		'https://videopress.com',
		'https://video.wordpress.com',
	];
	if ( -1 === allowed_origins.indexOf( event.origin as Origin ) ) {
		debug( '(%s) Invalid origin', context );
		return;
	}

	const { source: tokenRequester } = event;
	// Check the source of the message
	if (
		tokenRequester instanceof MessagePort ||
		( typeof ServiceWorker !== 'undefined' && tokenRequester instanceof ServiceWorker )
	) {
		debug( '(%s) Invalid source', context );
		return;
	}

	debug(
		'(%s) Request accepted: %o | %o | %o (%s)',
		context,
		guid,
		postId,
		requestId,
		requestToken.attempt
	);

	/*
	 * Acknowledge receipt of message so player knows
	 * if it can expect a response or if it should try again later.
	 * Important for situations where the iframe
	 * loads prior to the bridge being ready.
	 */
	debug( '(%s) Send acknowledge-receipt requested', context );
	tokenRequester.postMessage(
		{
			event: 'videopress_token_request_ack',
			guid,
			requestId,
		},
		{ targetOrigin: '*' }
	);

	requestToken.isRequesting = true;

	const tokenData = await getMediaToken( 'playback', {
		id: Number( postId ),
		guid,
		adminAjaxAPI: videopressAjax.ajaxUrl,
	} );

	requestToken.attempt++;
	requestToken.isRequesting = false;

	if ( ! tokenData?.token ) {
		debug( '(%s) Error getting token. Attempt %o', context, requestToken.attempt );
		tokenRequester.postMessage(
			{
				event: 'videopress_token_error',
				guid: event.data.guid,
				requestId,
			} as VideopressAjaxPostMessageEventProps,
			{ targetOrigin: '*' }
		);
		return;
	}

	debug( '(%s) Send token', context );
	tokenRequester.postMessage(
		{
			event: 'videopress_token_received',
			guid: guid,
			jwt: tokenData.token,
			requestId,
		} as VideopressAjaxPostMessageEventProps,
		{ targetOrigin: '*' }
	);
}

( function () {
	if ( ! videopressAjax ) {
		debug( '(%s) videopressAjax is not accesible' );
		return;
	}

	// Listen the token request from the videopress client
	debug( '(%s) 👂 Listen token requester', videopressAjax?.context || 'main' );
	window.addEventListener( 'message', tokenBridgeHandler );
} )();
