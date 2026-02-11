/**
 * Hook to stage editor changes to the entity store for synced forms.
 * Changes are staged (not saved to DB) so they can be picked up by the form editor.
 */

import { serialize } from '@wordpress/blocks';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedFormBlock, serializeSyncedForm } from '../util/form-sync.ts';

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
	 * Stage any pending changes to the entity store immediately.
	 * Call this before navigation to ensure edits are available in the shared store.
	 */
	flushPendingSave: () => void;
}

/**
 * Captures a baseline serialization when the form first loads.
 * Only captures after sync completes to ensure baseline reflects synced content.
 * Returns the baseline if ready, or null if still loading/syncing.
 *
 * @param {number | undefined}      ref                - The synced form post ID.
 * @param {Object | null}           syncedForm         - The synced form record.
 * @param {boolean}                 isSyncing          - Whether sync is in progress.
 * @param {Record<string, unknown>} attributes         - Current form attributes.
 * @param {unknown[]}               currentInnerBlocks - Current form inner blocks.
 * @param {React.MutableRefObject}  baselineRef        - Ref to store the baseline.
 * @return {string | null} The baseline serialization, or null if not ready.
 */
export function captureBaseline(
	ref: number | undefined,
	syncedForm: { content?: { raw?: string } } | null,
	isSyncing: boolean,
	attributes: Record< string, unknown >,
	currentInnerBlocks: unknown[],
	baselineRef: React.MutableRefObject< { ref: number; serialized: string } | null >
): string | null {
	// Not ready yet - need ref and syncedForm, and sync must be complete
	if ( ! ref || ! syncedForm || isSyncing ) {
		return null;
	}

	// Already have baseline for this ref
	if ( baselineRef.current?.ref === ref ) {
		return baselineRef.current.serialized;
	}

	// Capture new baseline
	const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
	baselineRef.current = { ref, serialized };
	return serialized;
}

/**
 * Stages form edits to the entity store.
 * Stores both serialized content and parsed blocks so the form editor can pick them up.
 *
 * @param {number}                  ref                - The synced form post ID.
 * @param {Record<string, unknown>} attributes         - Current form attributes.
 * @param {unknown[]}               currentInnerBlocks - Current form inner blocks.
 * @param {Function}                editEntityRecord   - Function to stage edits in entity store.
 */
export function stageFormEdits(
	ref: number,
	attributes: Record< string, unknown >,
	currentInnerBlocks: unknown[],
	editEntityRecord: UseSyncedFormAutoSaveParams[ 'editEntityRecord' ]
): void {
	// Create block once and reuse for both serialization and staging
	const formBlock = createSyncedFormBlock( attributes, currentInnerBlocks );
	const serialized = serialize( formBlock );
	editEntityRecord( 'postType', FORM_POST_TYPE, ref, {
		content: serialized,
		blocks: [ formBlock ],
	} );
}

/**
 * Hook to automatically stage changes from the editor to the entity store.
 * Uses a 1 second debounce to avoid excessive updates.
 *
 * Key behaviors:
 * - Captures a baseline when the form first loads (after sync completes)
 * - Only stages edits when content differs from baseline
 * - Stages both `content` and `blocks` so form editor can pick up changes
 * - Does NOT save to database - only stages in entity store
 *
 * @param {UseSyncedFormAutoSaveParams} params - Hook parameters.
 * @return {UseSyncedFormAutoSaveResult} Object with flushPendingSave function.
 */
export function useSyncedFormAutoSave( {
	ref,
	syncedForm,
	attributes,
	currentInnerBlocks,
	isSyncingRef,
	editEntityRecord,
}: UseSyncedFormAutoSaveParams ): UseSyncedFormAutoSaveResult {
	const pendingTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const baselineRef = useRef< { ref: number; serialized: string } | null >( null );

	// Reset baseline and clear any pending timeout when ref changes.
	useEffect( () => {
		baselineRef.current = null;

		if ( pendingTimeoutRef.current ) {
			clearTimeout( pendingTimeoutRef.current );
			pendingTimeoutRef.current = null;
		}
	}, [ ref ] );
	useEffect( () => {
		if ( ! ref ) {
			return;
		}
		// Only capture baseline after sync completes to ensure it reflects synced content
		const baseline = captureBaseline(
			ref,
			syncedForm,
			isSyncingRef.current,
			attributes,
			currentInnerBlocks,
			baselineRef
		);

		// Not ready or no changes - don't stage
		if ( ! baseline ) {
			return;
		}

		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		if ( serialized === baseline ) {
			return;
		}

		// Debounce staging
		const timeoutId = setTimeout( () => {
			pendingTimeoutRef.current = null;
			// Double-check we're not syncing when the timeout fires
			if ( ! isSyncingRef.current ) {
				stageFormEdits( ref, attributes, currentInnerBlocks, editEntityRecord );
			}
		}, 1000 );

		pendingTimeoutRef.current = timeoutId;

		return () => {
			clearTimeout( timeoutId );
			pendingTimeoutRef.current = null;
		};
	}, [ currentInnerBlocks, ref, syncedForm, editEntityRecord, attributes, isSyncingRef ] );

	const flushPendingSave = useCallback( () => {
		if ( ! ref ) {
			return;
		}
		const baseline = captureBaseline(
			ref,
			syncedForm,
			isSyncingRef.current,
			attributes,
			currentInnerBlocks,
			baselineRef
		);

		if ( ! baseline ) {
			return;
		}

		// Cancel pending debounced save
		if ( pendingTimeoutRef.current ) {
			clearTimeout( pendingTimeoutRef.current );
			pendingTimeoutRef.current = null;
		}

		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		if ( serialized !== baseline ) {
			stageFormEdits( ref, attributes, currentInnerBlocks, editEntityRecord );
		}
	}, [ ref, syncedForm, attributes, currentInnerBlocks, isSyncingRef, editEntityRecord ] );

	return { flushPendingSave };
}
