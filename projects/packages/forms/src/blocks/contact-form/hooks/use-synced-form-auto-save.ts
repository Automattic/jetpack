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
 * Returns the baseline if ready, or null if still loading/syncing.
 * @param ref
 * @param syncedForm
 * @param isSyncing
 * @param attributes
 * @param currentInnerBlocks
 * @param baselineRef
 */
export function captureBaseline(
	ref: number | undefined,
	syncedForm: { content?: { raw?: string } } | null,
	isSyncing: boolean,
	attributes: Record< string, unknown >,
	currentInnerBlocks: unknown[],
	baselineRef: React.MutableRefObject< { ref: number; serialized: string } | null >
): string | null {
	// Not ready yet
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
 * @param ref
 * @param attributes
 * @param currentInnerBlocks
 * @param editEntityRecord
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
	const pendingTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const baselineRef = useRef< { ref: number; serialized: string } | null >( null );

	// Reset baseline when ref changes
	const prevRefRef = useRef< number | undefined >( undefined );
	if ( ref !== prevRefRef.current ) {
		baselineRef.current = null;
		prevRefRef.current = ref;
	}

	useEffect( () => {
		const baseline = captureBaseline(
			ref,
			syncedForm,
			isSyncingRef.current,
			attributes,
			currentInnerBlocks,
			baselineRef
		);

		// Not ready or no changes
		if ( ! baseline || ! ref ) {
			return;
		}

		const serialized = serializeSyncedForm( attributes, currentInnerBlocks );
		if ( serialized === baseline ) {
			return;
		}

		// Debounce staging
		const timeoutId = setTimeout( () => {
			pendingTimeoutRef.current = null;
			stageFormEdits( ref, attributes, currentInnerBlocks, editEntityRecord );
		}, 1000 );

		pendingTimeoutRef.current = timeoutId;

		return () => {
			clearTimeout( timeoutId );
			pendingTimeoutRef.current = null;
		};
	}, [ currentInnerBlocks, ref, syncedForm, editEntityRecord, attributes, isSyncingRef ] );

	const flushPendingSave = useCallback( () => {
		const baseline = captureBaseline(
			ref,
			syncedForm,
			isSyncingRef.current,
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
