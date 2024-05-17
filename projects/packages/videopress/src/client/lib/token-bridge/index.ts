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
	subscriptionPlanId?: number;
	requestId: string;
	origin: Origin;
	isRetry?: boolean;
};

/**
 * Quick docReady implementation.
 * @returns {Promise} promise.
 */
function ready(): Promise< void > {
	return new Promise( function ( resolve ) {
		if ( document.readyState !== 'loading' ) {
			return resolve();
		}
		document.addEventListener( 'DOMContentLoaded', function () {
			resolve();
		} );
	} );
}

/**
 * Check if the guid has an associated subscriptionPlanId.
 *
 * @param {VideoGUID} guid - The guid.
 * @returns {Promise} promise.
 */
async function getSubscriberPlanIdIfExists( guid: VideoGUID ): Promise< number > {
	await ready();
	if ( ! window.__guidsToPlanIds ) {
		return 0;
	}
	const subscriptionPlanId = window.__guidsToPlanIds[ guid ] || 0;
	return subscriptionPlanId;
}

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

	const { guid, requestId, isRetry } = event.data;
	if ( ! guid || ! requestId ) {
		debug( '(%s) Invalid request', context );
		return;
	}

	const postId = window?.videopressAjax.post_id || 0;
	const subscriptionPlanId = await getSubscriberPlanIdIfExists( guid );

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

	debug( '(%s) Token request accepted: %o | %o | %o', context, guid, postId, requestId );

	/*
	 * Acknowledge receipt of message so player knows
	 * if it can expect a response or if it should try again later.
	 * Important for situations where the iframe
	 * loads prior to the bridge being ready.
	 */
	debug( '(%s) Send acknowledge receipt requested', context );
	tokenRequester.postMessage(
		{
			event: 'videopress_token_request_ack',
			guid,
			requestId,
		},
		{ targetOrigin: '*' }
	);

	if ( isRetry ) {
		debug( '(%s) client retrying request. Flush the token.', context );
	}

	const tokenData = await getMediaToken( 'playback', {
		id: Number( postId ),
		guid,
		subscriptionPlanId,
		adminAjaxAPI: videopressAjax.ajaxUrl,
		flushToken: isRetry, // flush the token if it's a retry
	} );

	if ( ! tokenData?.token ) {
		debug( '(%s) Error getting token', context );
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

	debug( '(%s) sending token', context );
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
