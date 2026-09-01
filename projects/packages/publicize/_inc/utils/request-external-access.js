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
 * @param {string}          url       - The URL to be loaded in the newly opened window.
 * @param {requestCallback} cb        - The callback that handles the response.
 * @param {Function}        [onAbort] - Called for the auth_flow=v2 flow when the attempt looks
 *                                    abandoned (the user returned to this window without a
 *                                    result, or the TTL elapsed).
 *
 * @return {boolean} `true` if the popup opened, `false` if it was blocked by the browser.
 */
export const requestExternalAccess = ( url, cb, onAbort ) => {
	const popupMonitor = new PopupMonitor();

	popupMonitor.open(
		url,
		null,
		'toolbar=0,location=0,status=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 780, 700 )
	);

	/*
	 * When the browser blocks the popup, window.open returns null (or, in some browsers, a window
	 * that is immediately closed). Bail out so the caller can let the user know what happened.
	 */
	const popup = popupMonitor.windowInstance;
	if ( ! popup || popup.closed || typeof popup.closed === 'undefined' ) {
		return false;
	}

	const requestId = new URL( url ).searchParams.get( 'request_id' );

	// auth_flow=v2: wait for the same-origin completion page to broadcast the request_id.
	if ( requestId && typeof BroadcastChannel !== 'undefined' ) {
		const channel = new BroadcastChannel( KEYRING_BROADCAST_CHANNEL );

		let resultReceived = false;

		/*
		 * Detect an abandoned attempt without watching the popup's 'close' event.
		 */
		const onWindowRefocused = () => {
			// Grace period so a result delivered as the popup closes still wins the race.
			setTimeout( () => {
				if ( ! resultReceived ) {
					onAbort?.();
				}
			}, 1000 );
		};

		const onPopupFocused = () => {
			window.addEventListener( 'focus', onWindowRefocused, { once: true } );
		};

		const stopWatching = () => {
			window.removeEventListener( 'blur', onPopupFocused );
			window.removeEventListener( 'focus', onWindowRefocused );
		};

		channel.addEventListener( 'message', event => {
			if ( event.data?.type === 'keyring-result' && event.data?.requestId === requestId ) {
				resultReceived = true;
				clearTimeout( cleanupTimer );
				stopWatching();
				channel.close();
				cb();
			}
		} );

		window.addEventListener( 'blur', onPopupFocused, { once: true } );

		// Backstop: give up after the server transient's TTL.
		const cleanupTimer = setTimeout(
			() => {
				stopWatching();
				channel.close();
				if ( ! resultReceived ) {
					onAbort?.();
				}
			},
			5 * 60 * 1000 // 5 minutes
		);

		return true;
	}

	// Legacy flow: the popup posts the keyring result back via window.opener.postMessage.
	let lastMessage;

	popupMonitor.once( 'close', () => {
		cb( lastMessage?.ID ? lastMessage : {} );
	} );

	popupMonitor.on( 'message', message => {
		lastMessage = message?.data;
	} );

	return true;
};
