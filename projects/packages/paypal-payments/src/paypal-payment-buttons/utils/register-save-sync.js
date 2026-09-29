/**
 * Hook the payment sync into the post save, and count the post saves for blocks to read.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { addAction, addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import metadata from '../block.json';
import { API_BASE } from './api-base';
import { syncBlocksBeforeSave } from './sync-on-save';
import { toast } from './toast';

// Successful post saves other than autosaves.
let postSaves = 0;
const listeners = new Set();

/**
 * Set the count and call the listeners.
 *
 * @param {number} next - The new count.
 */
function update( next ) {
	postSaves = next;
	listeners.forEach( listener => listener() );
}

/**
 * Call a function whenever the count changes.
 *
 * @param {Function} listener - Called with no arguments.
 * @return {Function} Unsubscribes the listener.
 */
export function subscribeToPostSaves( listener ) {
	listeners.add( listener );
	return () => listeners.delete( listener );
}

/**
 * How many post saves have succeeded.
 *
 * @return {number} The count, starting at 0.
 */
export function getPostSaveCount() {
	return postSaves;
}

/**
 * Forget the post saves counted. Tests start clean with this.
 */
export function forgetPostSaves() {
	update( 0 );
}

/**
 * Every PayPal block in the post, inner blocks included.
 *
 * @return {Array} Blocks with clientId and attributes.
 */
function payPalBlocks() {
	const store = select( blockEditorStore );

	return store
		.getClientIdsWithDescendants()
		.map( clientId => store.getBlock( clientId ) )
		.filter( block => block?.name === metadata.name );
}

/**
 * Whether the site is connected to PayPal.
 *
 * @return {Promise<boolean>} False on any failure: no connection, nothing to sync.
 */
async function isConnected() {
	try {
		const status = await apiFetch( { path: `${ API_BASE }/connection` } );
		return !! status?.connected;
	} catch {
		return false;
	}
}

/**
 * Sync the PayPal payments before the post is saved.
 *
 * Runs on `editor.preSavePost`, which awaits it and saves the content it returns.
 * The post is saved whether or not PayPal cooperated: an error is reported, and the
 * merchant can save again. The success snackbar waits for `editor.savePost`, which runs
 * after the post saves.
 *
 * @param {Function} isEnabled - Whether API-managed buttons are on for this site.
 */
export function registerSaveSync( isEnabled ) {
	// The success message, shown after the next post save that succeeds. It stays set through
	// a failed post save, since PayPal already has the change.
	let savedMessage = null;

	addFilter(
		'editor.preSavePost',
		'jetpack/paypal-payment-buttons/sync-payments',
		async ( edits, options ) => {
			if ( options?.isAutosave || ! isEnabled() ) {
				return edits;
			}

			const blocks = payPalBlocks();

			if ( ! blocks.length ) {
				return edits;
			}
			if ( ! ( await isConnected() ) ) {
				return edits;
			}

			// One entry per payment this save created (true) or changed (false).
			const saved = [];
			const changed = await syncBlocksBeforeSave( blocks, {
				request: apiFetch,
				updateBlockAttributes: dispatch( blockEditorStore ).updateBlockAttributes,
				reportError: ( { clientId }, message ) =>
					toast( 'error', message, `jetpack-paypal-sync-${ clientId }` ),
				// A block the merchant left incomplete is skipped, and the only other
				// sign is a line in the block sidebar. Say so where the save is watched.
				reportHeldBack: ( { clientId, attributes }, reason ) =>
					toast(
						'warning',
						sprintf(
							/* translators: 1: product name, 2: what to fix */
							__(
								'The PayPal button "%1$s" was not sent to PayPal: %2$s',
								'jetpack-paypal-payments'
							),
							attributes.productName || __( 'Untitled', 'jetpack-paypal-payments' ),
							reason
						),
						`jetpack-paypal-held-back-${ clientId }`
					),
				reportSaved: created => saved.push( created ),
			} );

			// Set before the `changed` check: a PUT can change the payment and leave the block as
			// it is. The create message replaces a pending update message, and stays until shown.
			if ( saved.includes( true ) ) {
				savedMessage = __( 'Payment link successfully created.', 'jetpack-paypal-payments' );
			} else if ( saved.length && ! savedMessage ) {
				savedMessage = __( 'Payment link changes saved.', 'jetpack-paypal-payments' );
			}

			if ( ! changed ) {
				return edits;
			}

			// The blocks now carry their payment ids; save that content, not the
			// snapshot taken before this ran.
			const content = select( editorStore ).getEditedPostContent();
			dispatch( editorStore ).editPost( { content }, { undoIgnore: true } );

			return { ...edits, content };
		}
	);

	// Runs after the post saves. An autosave skips the PayPal sync, so the message waits
	// for the next save.
	addAction(
		'editor.savePost',
		'jetpack/paypal-payment-buttons/saved-snackbar',
		( post, options ) => {
			if ( options?.isAutosave || ! savedMessage ) {
				return;
			}

			toast( 'success', savedMessage, 'jetpack-paypal-saved' );
			savedMessage = null;
		}
	);

	// Runs after the post saves, and counts every save except autosaves.
	addAction( 'editor.savePost', 'jetpack/paypal-payment-buttons/post-saves', ( post, options ) => {
		if ( options?.isAutosave ) {
			return;
		}

		update( postSaves + 1 );
	} );
}
