import PopupMonitor from '@automattic/popup-monitor';

/**
 * The BroadcastChannel name shared with the same-origin connect completion page.
 *
 * Must match the channel used by the `jetpack_social_keyring_done` admin-post handler.
 */
export const KEYRING_BROADCAST_CHANNEL = 'jetpack-social-keyring';

/**
 * The callback function of the requestExternalAccess utility.
 * @callback requestCallback
 * @param {import('../social-store/types').KeyringResult} [result] - Received authentication data (legacy postMessage flow only).
 */

/**
 * Utility for requesting authorization of sharing services.
 *
 * For the auth_flow=v2 flow (when the URL carries a `request_id`), the connect popup can no
 * longer talk to its opener — Meta/Threads sever `window.opener` via COOP. Instead, public-api
 * redirects the popup back to a same-origin completion page on this site, which broadcasts the
 * `request_id` over a {@link https://developer.mozilla.org/docs/Web/API/BroadcastChannel BroadcastChannel}.
 * We listen for that broadcast here and invoke the callback, which fetches the verified result.
 *
 * The legacy `window.opener.postMessage` path is kept as a fallback for URLs without a
 * `request_id`.
 *
 * @param {string}          url - The URL to be loaded in the newly opened window.
 * @param {requestCallback} cb  - The callback that handles the response.
 */
export const requestExternalAccess = ( url, cb ) => {
	const popupMonitor = new PopupMonitor();

	const requestId = new URL( url ).searchParams.get( 'request_id' );

	popupMonitor.open(
		url,
		null,
		'toolbar=0,location=0,status=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 780, 700 )
	);

	// auth_flow=v2: wait for the same-origin completion page to broadcast the request_id.
	if ( requestId && typeof BroadcastChannel !== 'undefined' ) {
		const channel = new BroadcastChannel( KEYRING_BROADCAST_CHANNEL );

		let settled = false;

		const finish = () => {
			if ( settled ) {
				return;
			}
			settled = true;
			channel.close();
			cb();
		};

		channel.addEventListener( 'message', event => {
			if ( event.data?.type === 'keyring-result' && event.data?.requestId === requestId ) {
				finish();
			}
		} );

		// Safety net: stop listening if the channel is never used (e.g. the user abandons the flow).
		popupMonitor.once( 'close', () => {
			// The close event is unreliable under COOP (it can fire before auth completes),
			// so it is only used to release the channel after a grace period — never as success.
			setTimeout( () => {
				if ( ! settled ) {
					settled = true;
					channel.close();
				}
			}, 5000 );
		} );

		return;
	}

	// Legacy flow: the popup posts the keyring result back via window.opener.postMessage.
	let lastMessage;

	popupMonitor.once( 'close', () => {
		cb( lastMessage?.ID ? lastMessage : {} );
	} );

	popupMonitor.on( 'message', message => {
		lastMessage = message?.data;
	} );
};
