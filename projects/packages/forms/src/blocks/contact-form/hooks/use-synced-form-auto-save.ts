/**
 * Hook to auto-save editor changes back to synced form post
 */

import { useCallback, useEffect, useRef } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedFormBlock, serializeSyncedForm } from '../util/form-sync.ts';

const DEBUG = false;
// eslint-disable-next-line no-console
const log = ( ...args: unknown[] ) => DEBUG && console.log( '[AutoSave]', ...args );

interface UseSyncedFormAutoSaveParams {
	ref?: number;
	syncedForm: { content?: { raw?: string } } | null;
	attributes: Record< string, unknown >;
	currentInnerBlocks: unknown[];
	isSyncingRef: React.MutableRefObject< boolean >;
	editEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		edits: Record< string, unknown >
	) => void;
}

interface UseSyncedFormAutoSaveResult {
	/**
	 * Immediately stage any pending changes to the entity store, bypassing the debounce.
	 * Call this before navigation to ensure edits are available in the shared store.
	 * Note: This does NOT save to the database - it only stages edits so the form editor can access them.
	 */
	flushPendingSave: () => void;
}

/**
 * Hook to automatically save changes from the editor back to the synced form post
 * Uses a debounce strategy to avoid excessive saves (1 second delay)
 * Only saves if content has changed and we're not currently loading
 * @param root0
 * @param root0.ref
 * @param root0.syncedForm
 * @param root0.attributes
 * @param root0.currentInnerBlocks
 * @param root0.isSyncingRef
 * @param root0.editEntityRecord
 */
export function useSyncedFormAutoSave( {
	ref,
	syncedForm,
	attributes,
	currentInnerBlocks,
	isSyncingRef,
	editEntityRecord,
}: UseSyncedFormAutoSaveParams ): UseSyncedFormAutoSaveResult {
	// Track pending timeout so we can cancel it when flushing
	const pendingTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const hasPendingSaveRef = useRef( false );

	// Track the initial serialized state after syncing completes.
	// We compare against this baseline instead of the raw database content because
	// the database content may have fewer attributes (only non-defaults are saved),
	// while the editor block has all attributes including defaults.
	const initialSerializedRef = useRef< string | null >( null );
	const lastSyncedRefId = useRef< number | null >( null );
	const wasSyncingRef = useRef( false );

	// Detect when syncing completes (transition from syncing to not syncing)
	const justFinishedSyncing = wasSyncingRef.current && ! isSyncingRef.current;
	wasSyncingRef.current = isSyncingRef.current;

	// Reset baseline when ref changes
	if ( ref !== lastSyncedRefId.current ) {
		initialSerializedRef.current = null;
		lastSyncedRefId.current = ref ?? null;
	}

	// Capture baseline after syncing completes
	if ( justFinishedSyncing && ref && ! initialSerializedRef.current ) {
		initialSerializedRef.current = serializeSyncedForm( attributes, currentInnerBlocks );
		log( '📌 Baseline captured', { ref, length: initialSerializedRef.current.length } );
	}

	useEffect( () => {
		// Skip if not ready
		if ( ! ref || ! syncedForm || isSyncingRef.current || ! initialSerializedRef.current ) {
			return;
		}

		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		const baseline = initialSerializedRef.current;

		// Only stage edits if content changed from baseline
		if ( serialized !== baseline ) {
			hasPendingSaveRef.current = true;

			const timeoutId = setTimeout( () => {
				hasPendingSaveRef.current = false;
				pendingTimeoutRef.current = null;
				log( '💾 Staging edits', { ref } );
				// Stage both content (for saving) and blocks (for block editor to pick up)
				const formBlock = createSyncedFormBlock( attributes, currentInnerBlocks );
				editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
					content: serialized,
					blocks: [ formBlock ],
				} );
			}, 1000 );

			pendingTimeoutRef.current = timeoutId;

			return () => {
				clearTimeout( timeoutId );
				pendingTimeoutRef.current = null;
			};
		}

		hasPendingSaveRef.current = false;
	}, [ currentInnerBlocks, ref, syncedForm, editEntityRecord, attributes, isSyncingRef ] );

	const flushPendingSave = useCallback( () => {
		if ( ! ref || ! syncedForm || isSyncingRef.current || ! initialSerializedRef.current ) {
			return;
		}

		// Cancel pending timeout if any
		if ( pendingTimeoutRef.current ) {
			clearTimeout( pendingTimeoutRef.current );
			pendingTimeoutRef.current = null;
		}

		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		const baseline = initialSerializedRef.current;

		if ( serialized !== baseline ) {
			log( '📝 Flush: staging edits', { ref } );
			// Stage both content (for saving) and blocks (for block editor to pick up)
			const formBlock = createSyncedFormBlock( attributes, currentInnerBlocks );
			editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
				content: serialized,
				blocks: [ formBlock ],
			} );
			hasPendingSaveRef.current = false;
		} else {
			log( '✅ Flush: no changes' );
		}
	}, [ ref, syncedForm, attributes, currentInnerBlocks, isSyncingRef, editEntityRecord ] );

	return { flushPendingSave };
}
