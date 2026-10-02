/**
 * PayPal Payment Buttons - The PayPal account's status, shared by every block.
 *
 * Read once per editor, and again after the connection changes. The server's notices,
 * which PayPal requires the seller to see, show as one editor warning.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { API_BASE } from './api-base';

const NOTICE_ID = 'jetpack-paypal-merchant-status';

// This connection's read, kept after it settles so every block shares one request.
let read = null;

/**
 * Read the status once per connection and show its notices. After a failed read, the
 * next read waits for a page reload or a connection change.
 */
export function loadMerchantStatus() {
	if ( read ) {
		return;
	}

	const request = apiFetch( { path: `${ API_BASE }/onboarding/status` } )
		.catch( () => null )
		.then( response => {
			// A read sent before the connection changed is for the old account. Drop it.
			if ( read !== request || ! response?.notices?.length ) {
				return;
			}
			// A warning notice rather than toast(), so it stays up until the seller dismisses it.
			dispatch( noticesStore ).createWarningNotice( response.notices.join( ' ' ), {
				id: NOTICE_ID,
				isDismissible: true,
			} );
		} );
	read = request;
}

/**
 * Forget the status and take its warning down, so the next block to ask reads it
 * again. For a connection change, and a clean start in tests.
 */
export function forgetMerchantStatus() {
	read = null;
	dispatch( noticesStore ).removeNotice( NOTICE_ID );
}
