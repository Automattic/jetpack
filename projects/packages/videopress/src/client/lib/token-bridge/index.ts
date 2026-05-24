/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import getMediaToken from '../get-media-token';
import { isAllowedOrigin } from '../videopress-allowed-origins';
/**
 * Types
 */
import type { VideoGUID } from '../../block-editor/blocks/video/types';

const debug = debugFactory( 'videopress:token-bridge' );

type VideopressAjaxPostMessageEventProps = {
	event: 'videopress_token_request_ack' | 'videopress_token_received' | 'videopress_token_error';
	guid: VideoGUID;
	requestId: string;
	jwt?: string;
};

const { videopressAjax } = window;

type TokenBrigeEventProps = {
	event: 'videopress_token_request';
	guid: VideoGUID;
	subscriptionPlanId?: number;
	requestId: string;
	isRetry?: boolean;
};

/**
 * Quick docReady implementation.
 * @return {Promise} promise.
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
 * @return {Promise} promise.
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

	if ( ! isAllowedOrigin( event.origin ) ) {
		debug( '(%s) Invalid origin', context );
		return;
	}

	const { source: tokenRequester } = event;
	// Check the source of the message
	if (
		! tokenRequester ||
		tokenRequester instanceof MessagePort ||
		( typeof ServiceWorker !== 'undefined' && tokenRequester instanceof ServiceWorker )
	) {
		debug( '(%s) Invalid source', context );
		return;
	}

	const postId = window?.videopressAjax.post_id || 0;
	const subscriptionPlanId = await getSubscriberPlanIdIfExists( guid );

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
		{ targetOrigin: event.origin }
	);

	if ( isRetry ) {
		debug( '(%s) client retrying request. Flush the token.', context );
	}

	let tokenData;
	try {
		tokenData = await getMediaToken( 'playback', {
			id: Number( postId ),
			guid,
			subscriptionPlanId,
			adminAjaxAPI: videopressAjax.ajaxUrl,
			flushToken: isRetry, // flush the token if it's a retry
		} );
	} catch ( error ) {
		debug( '(%s) Unexpected error getting token: %o', context, error );
	}

	if ( ! tokenData?.token ) {
		debug( '(%s) Error getting token', context );
		tokenRequester.postMessage(
			{
				event: 'videopress_token_error',
				guid,
				requestId,
			} as VideopressAjaxPostMessageEventProps,
			{ targetOrigin: event.origin }
		);
		return;
	}

	debug( '(%s) sending token', context );
	tokenRequester.postMessage(
		{
			event: 'videopress_token_received',
			guid,
			jwt: tokenData.token,
			requestId,
		} as VideopressAjaxPostMessageEventProps,
		{ targetOrigin: event.origin }
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
