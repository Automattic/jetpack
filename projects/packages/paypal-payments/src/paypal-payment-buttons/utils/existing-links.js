/**
 * PayPal Payment Buttons - The account's existing payment links, shared by every block.
 *
 * Module level, like the save sync's maps, so the save sync can update it from outside
 * React. Read when a block first needs it, and again by the next picker to open after
 * a save writes to PayPal.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { __ } from '@wordpress/i18n';
import { API_BASE } from './api-base';
import { toast } from './toast';
import { getUserFriendlyError, isNotFound } from './validation';

// Replaced on every change, so React renders again. `loaded` is false while blocks wait
// on a read: before the first one, after a forget, or for an empty list marked dirty.
let snapshot = { links: [], loaded: false };
// The read in flight, so blocks asking at the same time share one request.
let pending = null;
// Whether the list may be out of date: never read, the read failed, or this editor
// wrote to PayPal after the read went out.
let dirty = true;
// Links deleted in this editor, filtered from a read already on its way.
const deleted = new Set();
const listeners = new Set();

/**
 * Replace the list and tell every block reading it.
 *
 * @param {object} next - The new snapshot.
 */
function update( next ) {
	snapshot = next;
	listeners.forEach( listener => listener() );
}

/**
 * Call a function whenever the list changes.
 *
 * @param {Function} listener - Called with no arguments.
 * @return {Function} Stops the calls.
 */
export function subscribeToExistingLinks( listener ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * The list as it stands.
 *
 * @return {{ links: Array, loaded: boolean }} The links, newest first, and whether there is a list to show.
 */
export function getExistingLinks() {
	return snapshot;
}

/**
 * Read the list from PayPal when it is dirty and no read is on its way. The current
 * list stays up meanwhile.
 *
 * One page at the route's maximum: PayPal has no server-side search, and the
 * step filters locally.
 */
export function loadExistingLinks() {
	if ( pending || ! dirty ) {
		return;
	}
	dirty = false;

	const request = apiFetch( { path: `${ API_BASE }/buttons?page_size=100` } )
		.then( response => ( Array.isArray( response?.resources ) ? response.resources : [] ) )
		.catch( () => null )
		.then( links => {
			// Only the latest read counts. One sent before a reconnect is for the old account.
			if ( pending !== request ) {
				return;
			}
			pending = null;
			// A failed read keeps the current list and stays dirty, so the next picker tries again.
			if ( ! links ) {
				dirty = true;
			}
			update( {
				links: links ? links.filter( link => ! deleted.has( link.id ) ) : snapshot.links,
				loaded: true,
			} );
		} );
	pending = request;
}

/**
 * Mark the list dirty, so the next picker to open reads it again.
 */
export function markExistingLinksDirty() {
	dirty = true;
	// An empty list goes back to unloaded, so the blocks wait for the new read before
	// skipping the step.
	if ( snapshot.loaded && ! snapshot.links.length ) {
		update( { ...snapshot, loaded: false } );
	}
}

/**
 * Put a new link at the top of the list, and mark the list dirty, since a read on its
 * way may miss the link.
 *
 * @param {object} link - The payment resource PayPal returned.
 */
export function addExistingLink( link ) {
	dirty = true;
	if ( snapshot.loaded ) {
		update( {
			...snapshot,
			links: [ link, ...snapshot.links.filter( ( { id } ) => id !== link.id ) ],
		} );
	}
}

/**
 * Drop a deleted link from the list.
 *
 * @param {string} id - The resource id.
 */
export function removeExistingLink( id ) {
	deleted.add( id );
	if ( snapshot.links.some( link => link.id === id ) ) {
		update( { ...snapshot, links: snapshot.links.filter( link => link.id !== id ) } );
	}
}

/**
 * Delete a link from PayPal and drop it from the list. Reports in the snackbar.
 *
 * @param {string} id - The resource id.
 * @return {Promise<boolean>} Whether the link is gone, including when PayPal had already deleted it.
 */
export function deleteExistingLink( id ) {
	const drop = message => {
		removeExistingLink( id );
		toast( 'success', message );
		return true;
	};
	return apiFetch( { path: `${ API_BASE }/buttons/${ id }`, method: 'DELETE' } )
		.then( () => drop( __( 'Payment link deleted.', 'jetpack-paypal-payments' ) ) )
		.catch( err => {
			// Already gone from PayPal, so the list is stale rather than the delete failed.
			if ( isNotFound( err ) ) {
				return drop(
					__( 'The payment link was already removed from PayPal.', 'jetpack-paypal-payments' )
				);
			}
			toast( 'error', getUserFriendlyError( err ) );
			return false;
		} );
}

/**
 * Forget the list and any read on its way, so the next block that needs it reads it
 * again. For a new PayPal connection, and a clean start in tests.
 */
export function forgetExistingLinks() {
	pending = null;
	dirty = true;
	deleted.clear();
	update( { links: [], loaded: false } );
}
