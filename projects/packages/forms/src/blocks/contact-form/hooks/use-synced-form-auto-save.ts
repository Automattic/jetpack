/**
 * Hook to stage editor changes to the entity store for synced forms.
 * Changes are staged (not saved to DB) so they can be picked up by the form editor.
 */

import { useCallback, useEffect, useRef } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedFormBlock, serializeSyncedForm } from '../util/form-sync.ts';

interface UseSyncedFormAutoSaveParams {
	/** The synced form post ID */
	ref?: number;
	/** The synced form record from the entity store */
	syncedForm: { content?: { raw?: string } } | null;
	/** Current form block attributes */
	attributes: Record< string, unknown >;
	/** Current form inner blocks */
	currentInnerBlocks: unknown[];
	/** Ref indicating if form is currently being synced from source */
	isSyncingRef: React.MutableRefObject< boolean >;
	/** Function to stage edits in the entity store */
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
 * Baseline is captured even during sync so it's ready when sync completes.
 * Returns the baseline if ready, or null if still loading.
 *
 * @param {number | undefined}      ref                - The synced form post ID.
 * @param {Object | null}           syncedForm         - The synced form record.
 * @param {Record<string, unknown>} attributes         - Current form attributes.
 * @param {unknown[]}               currentInnerBlocks - Current form inner blocks.
 * @param {React.MutableRefObject}  baselineRef        - Ref to store the baseline.
 * @return {string | null} The baseline serialization, or null if not ready.
 */
export function captureBaseline(
	ref: number | undefined,
	syncedForm: { content?: { raw?: string } } | null,
	attributes: Record< string, unknown >,
	currentInnerBlocks: unknown[],
	baselineRef: React.MutableRefObject< { ref: number; serialized: string } | null >
): string | null {
	// Not ready yet - need ref and syncedForm to be available
	if ( ! ref || ! syncedForm ) {
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
	const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
	const formBlock = createSyncedFormBlock( attributes, currentInnerBlocks );
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

	// Reset baseline when ref changes
	const prevRefRef = useRef< number | undefined >( undefined );
	if ( ref !== prevRefRef.current ) {
		baselineRef.current = null;
		prevRefRef.current = ref;
	}

	useEffect( () => {
		// Capture baseline even during sync so it's ready when sync completes
		const baseline = captureBaseline(
			ref,
			syncedForm,
			attributes,
			currentInnerBlocks,
			baselineRef
		);

		// Not ready, still syncing, or no changes - don't stage
		if ( ! baseline || ! ref || isSyncingRef.current ) {
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
		// Don't flush while syncing
		if ( isSyncingRef.current ) {
			return;
		}

		const baseline = captureBaseline(
			ref,
			syncedForm,
			attributes,
			currentInnerBlocks,
			baselineRef
		);

		if ( ! baseline || ! ref ) {
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
