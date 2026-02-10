/**
 * Hook to auto-save editor changes back to synced form post
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { serializeSyncedForm } from '../util/form-sync.ts';

const DEBUG = true;
const log = ( ...args: unknown[] ) => DEBUG && console.log( '[useSyncedFormAutoSave]', ...args );

// Track saves for debugging
let effectRunCount = 0;
let saveScheduledCount = 0;
let saveExecutedCount = 0;
let cleanupCount = 0;

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
	 * Immediately save any pending changes, bypassing the debounce.
	 * Call this before navigation to ensure changes are persisted.
	 */
	flushPendingSave: () => void;
}

/**
 * Hook to automatically save changes from the editor back to the synced form post
 * Uses a debounce strategy to avoid excessive saves (1 second delay)
 * Only saves if content has changed and we're not currently loading
 *
 * @param {UseSyncedFormAutoSaveParams} params - Configuration parameters
 * @return {UseSyncedFormAutoSaveResult} Object containing flushPendingSave function
 */
export function useSyncedFormAutoSave( {
	ref,
	syncedForm,
	attributes,
	currentInnerBlocks,
	isSyncingRef,
	editEntityRecord,
}: UseSyncedFormAutoSaveParams ): UseSyncedFormAutoSaveResult {
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const renderCountRef = useRef( 0 );
	const prevInnerBlocksRef = useRef< unknown[] | null >( null );
	const prevAttributesRef = useRef< Record< string, unknown > | null >( null );
	const prevSyncedFormRef = useRef< typeof syncedForm | null >( null );

	// Track pending timeout so we can cancel it when flushing
	const pendingTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	// Track if there's a pending save that hasn't executed yet
	const hasPendingSaveRef = useRef( false );

	renderCountRef.current++;

	// Check what changed since last render
	const innerBlocksChanged = prevInnerBlocksRef.current !== currentInnerBlocks;
	const attributesChanged = prevAttributesRef.current !== attributes;
	const syncedFormChanged = prevSyncedFormRef.current !== syncedForm;

	log( `Render #${ renderCountRef.current }`, {
		ref,
		hasSyncedForm: !! syncedForm,
		syncedFormContentLength: syncedForm?.content?.raw?.length,
		isSyncing: isSyncingRef.current,
		attributeKeys: Object.keys( attributes ),
		innerBlocksCount: currentInnerBlocks.length,
		// Track what changed
		changes: {
			innerBlocksChanged,
			attributesChanged,
			syncedFormChanged,
		},
	} );

	// Update refs for next comparison
	prevInnerBlocksRef.current = currentInnerBlocks;
	prevAttributesRef.current = attributes;
	prevSyncedFormRef.current = syncedForm;

	useEffect( () => {
		effectRunCount++;
		const thisEffectRun = effectRunCount;

		log( `Effect #${ thisEffectRun } triggered`, {
			ref,
			hasSyncedForm: !! syncedForm,
			isSyncing: isSyncingRef.current,
			stats: { effectRunCount, saveScheduledCount, saveExecutedCount, cleanupCount },
		} );

		if ( ! ref ) {
			log( `Effect #${ thisEffectRun } ⏭️ Skipping: no ref` );
			return;
		}

		if ( ! syncedForm ) {
			log( `Effect #${ thisEffectRun } ⏭️ Skipping: no syncedForm` );
			return;
		}

		if ( isSyncingRef.current ) {
			log(
				`Effect #${ thisEffectRun } ⏭️ Skipping: currently syncing (isSyncingRef.current = true)`
			);
			return;
		}

		// Serialize the entire form block
		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		const savedContent = syncedForm.content?.raw;

		log( `Effect #${ thisEffectRun } 📊 Content comparison`, {
			serializedLength: serialized.length,
			savedContentLength: savedContent?.length ?? 0,
			areEqual: serialized === savedContent,
			serializedPreview: serialized.substring( 0, 200 ),
			savedContentPreview: savedContent?.substring( 0, 200 ),
		} );

		// Only update if content has changed
		if ( serialized !== savedContent ) {
			saveScheduledCount++;
			const thisSaveScheduled = saveScheduledCount;
			log(
				`Effect #${ thisEffectRun } ⏳ Save #${ thisSaveScheduled } scheduled (1000ms debounce)`
			);

			// Mark that we have a pending save
			hasPendingSaveRef.current = true;

			// Debounce to avoid excessive saves
			const timeoutId = setTimeout( () => {
				saveExecutedCount++;
				hasPendingSaveRef.current = false;
				pendingTimeoutRef.current = null;
				log(
					`Effect #${ thisEffectRun } 💾 Save #${ thisSaveScheduled } EXECUTING (executed: ${ saveExecutedCount })`,
					{
						ref,
						contentLength: serialized.length,
					}
				);
				editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
					content: serialized,
				} );
			}, 1000 ); // 1 second debounce

			// Store timeout ref so flushPendingSave can cancel it
			pendingTimeoutRef.current = timeoutId;

			return () => {
				cleanupCount++;
				log(
					`Effect #${ thisEffectRun } 🧹 Cleanup #${ cleanupCount }: Save #${ thisSaveScheduled } CANCELLED`
				);
				clearTimeout( timeoutId );
				pendingTimeoutRef.current = null;
				// Note: hasPendingSaveRef stays true because the save was cancelled, not completed
			};
		}
		hasPendingSaveRef.current = false;

		log( `Effect #${ thisEffectRun } ✅ Content matches saved, no save needed` );
	}, [ currentInnerBlocks, ref, syncedForm, editEntityRecord, attributes, isSyncingRef ] );

	// Function to immediately save any pending changes to the database
	const flushPendingSave = useCallback( async () => {
		if ( ! ref || ! syncedForm || isSyncingRef.current ) {
			log( 'flushPendingSave: skipping (no ref, no syncedForm, or syncing)' );
			return;
		}

		// Cancel pending timeout if any
		if ( pendingTimeoutRef.current ) {
			clearTimeout( pendingTimeoutRef.current );
			pendingTimeoutRef.current = null;
		}

		// Serialize and save immediately
		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		const savedContent = syncedForm.content?.raw;

		if ( serialized !== savedContent ) {
			log( '🚨 flushPendingSave: SAVING TO DATABASE', {
				ref,
				contentLength: serialized.length,
				hadPendingSave: hasPendingSaveRef.current,
			} );

			// First update the entity record (creates pending edits)
			editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
				content: serialized,
			} );

			// Then actually save to the database
			try {
				await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, ref );
				log( '✅ flushPendingSave: saved to database successfully' );
			} catch ( error ) {
				log( '❌ flushPendingSave: failed to save to database', error );
			}

			hasPendingSaveRef.current = false;
		} else {
			log( 'flushPendingSave: no changes to save' );
		}
	}, [
		ref,
		syncedForm,
		attributes,
		currentInnerBlocks,
		isSyncingRef,
		editEntityRecord,
		saveEditedEntityRecord,
	] );

	return { flushPendingSave };
}
