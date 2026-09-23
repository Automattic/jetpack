/**
 * Hook the payment sync into the post save.
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
 * merchant can save again. What PayPal saved is shown on `editor.savePost`, which runs
 * only once the post has saved.
 *
 * @param {Function} isEnabled - Whether API-managed buttons are on for this site.
 */
export function registerSaveSync( isEnabled ) {
	// The snackbar for what this save wrote to PayPal, held until the post has saved.
	let savedMessage = null;

	addFilter(
		'editor.preSavePost',
		'jetpack/paypal-payment-buttons/sync-payments',
		async ( edits, options ) => {
			// A save that failed never reaches the action below, so drop what it left.
			savedMessage = null;

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

			// Whether each payment written in this save was created, for one snackbar per save.
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

			// Set even when no attributes changed: a PUT can still have saved to PayPal.
			if ( saved.length ) {
				savedMessage = saved.includes( true )
					? __( 'Payment link successfully created.', 'jetpack-paypal-payments' )
					: __( 'Changes saved.', 'jetpack-paypal-payments' );
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

	// Runs only once the post has saved, so a failed save doesn't also show a success snackbar.
	addAction( 'editor.savePost', 'jetpack/paypal-payment-buttons/saved-snackbar', () => {
		if ( savedMessage ) {
			toast( 'success', savedMessage, 'jetpack-paypal-saved' );
			savedMessage = null;
		}
	} );
}
