/**
 * PayPal Payment Buttons — The site-wide PayPal connection.
 *
 * @package
 */

/**
 * The PayPal connection is stored per-site, not per-block, so connecting or
 * disconnecting from one block changes the state of every other block in the
 * editor. Each instance only learns that from its own `/connection` fetch on
 * mount, so the block that made the change broadcasts it to its siblings.
 */
export const CONNECTION_CHANGED_EVENT = 'jetpack-paypal-payments-connection-changed';

/**
 * Tell the other blocks on this page that the site-wide PayPal connection
 * changed.
 *
 * @param {boolean} connected - The new connection state.
 */
export function broadcastConnectionChange( connected ) {
	window.dispatchEvent( new CustomEvent( CONNECTION_CHANGED_EVENT, { detail: { connected } } ) );
}
