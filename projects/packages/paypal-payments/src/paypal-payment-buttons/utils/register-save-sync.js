/**
 * Hook the payment sync into the post save.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor'; // eslint-disable-line import/no-unresolved
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices'; // eslint-disable-line import/no-unresolved
import metadata from '../block.json';
import { API_BASE } from './api-base';
import { deleteRemovedPayments, removedResourceIds, syncBlocksBeforeSave } from './sync-on-save';

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

// How long a save notice stays on screen.
const TOAST_MS = 5000;

/**
 * Show a short-lived snackbar, replacing an earlier one with the same id.
 *
 * @param {string} status  - 'error' or 'warning'.
 * @param {string} message - What to say.
 * @param {string} id      - Notice id, one per block and kind.
 */
function toast( status, message, id ) {
	const { createNotice, removeNotice } = dispatch( noticesStore );
	createNotice( status, message, { type: 'snackbar', id } );
	setTimeout( () => removeNotice( id ), TOAST_MS );
}

/**
 * Sync the PayPal payments before the post is saved.
 *
 * Runs on `editor.preSavePost`, which awaits it and saves the content it returns.
 * The post is saved whether or not PayPal cooperated: an error is reported, and the
 * merchant can save again.
 *
 * @param {Function} isEnabled - Whether API-managed buttons are on for this site.
 */
export function registerSaveSync( isEnabled ) {
	addFilter(
		'editor.preSavePost',
		'jetpack/paypal-payment-buttons/sync-payments',
		async ( edits, options ) => {
			if ( options?.isAutosave || ! isEnabled() ) {
				return edits;
			}

			const blocks = payPalBlocks();
			const saved = select( editorStore ).getCurrentPost();
			const savedContent = typeof saved?.content === 'string' ? saved.content : saved?.content?.raw;
			const removed = removedResourceIds( savedContent, edits?.content );

			if ( ! blocks.length && ! removed.length ) {
				return edits;
			}
			if ( ! ( await isConnected() ) ) {
				return edits;
			}

			await deleteRemovedPayments( removed, saved?.id, { request: apiFetch } );

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
			} );

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
}
