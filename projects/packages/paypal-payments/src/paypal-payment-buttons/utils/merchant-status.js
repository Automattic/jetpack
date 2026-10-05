/**
 * PayPal Payment Buttons - The PayPal account's status, shared by every block.
 *
 * Read once per editor, and again after the connection changes. The server's notices,
 * which PayPal requires the seller to see, show on each block's canvas.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { API_BASE } from './api-base';

// A new array on every change, so useSyncExternalStore sees it.
let notices = [];
// This connection's read, kept after it settles so every block shares one request.
let read = null;
const listeners = new Set();

/**
 * Replace the notices and call every listener.
 *
 * @param {string[]} next - The new notices.
 */
function update( next ) {
	notices = next;
	listeners.forEach( listener => listener() );
}

/**
 * Call a function whenever the notices change.
 *
 * @param {Function} listener - Called with no arguments.
 * @return {Function} Unsubscribes the listener.
 */
export function subscribeToMerchantStatus( listener ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * Get the current notices.
 *
 * @return {string[]} The server's translated notices, empty until a read returns some.
 */
export function getMerchantNotices() {
	return notices;
}

/**
 * Read the status once per connection. After a failed read, the next read waits for
 * a page reload or a connection change.
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
			update( response.notices );
		} );
	read = request;
}

/**
 * Forget the status and its notices, so the next block to ask reads it again. For a
 * connection change, and a clean start in tests.
 */
export function forgetMerchantStatus() {
	read = null;
	update( [] );
}
