import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

// Not exported by @wordpress/core-data; see its utils/crdt.
const CRDT_META_KEY = '_crdt_document';

/**
 * Clears the phantom "unsaved changes" state a post meta edit leaves behind under real-time
 * collaboration. A fresh `_crdt_document` is serialized into the save payload after the edit was
 * staged, so core-data's whole-object `meta` comparison never matches and the post reads
 * "Save draft" forever. After a successful save, realign that key against the persisted record.
 * No-op when collaboration is off, and once this is fixed upstream.
 *
 * @param {string} postType - Post type being edited.
 * @param {number} postId   - Record ID being edited.
 */
export default function useClearPhantomMetaDirt( postType, postId ) {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();
	// Tracks the entity request, not the editor's save cycle: that cycle also completes when
	// `editor.preSavePost` rejects and no request was ever made. Autosaves skip `prePersist`,
	// so they mint no snapshot to reconcile.
	const isSaving = useSelect(
		select => {
			const { isSavingEntityRecord, isAutosavingEntityRecord } = select( coreDataStore );
			return (
				!! postType &&
				!! postId &&
				isSavingEntityRecord( 'postType', postType, postId ) &&
				! isAutosavingEntityRecord( 'postType', postType, postId )
			);
		},
		[ postType, postId ]
	);
	const wasSavingRef = useRef( false );

	useEffect( () => {
		const finished = wasSavingRef.current && ! isSaving;
		wasSavingRef.current = isSaving;

		if ( ! finished ) {
			return;
		}

		const { getEntityRecordEdits, getLastEntitySaveError, getRawEntityRecord } =
			registry.select( coreDataStore );

		if ( getLastEntitySaveError( 'postType', postType, postId ) ) {
			return;
		}

		const staged = getEntityRecordEdits( 'postType', postType, postId )?.meta;
		const persisted = getRawEntityRecord( 'postType', postType, postId )?.meta;

		if ( ! staged || ! persisted ) {
			return;
		}

		// Only the CRDT blob: nothing in the editor edits it, so adopting the persisted copy cannot
		// discard a pending change. Every other difference is left alone, because the payload is
		// snapshotted before the request starts and never becomes observable -- a key the server
		// altered is indistinguishable from one the writer edited or dropped mid-save.
		if ( staged[ CRDT_META_KEY ] === persisted[ CRDT_META_KEY ] ) {
			return;
		}

		editEntityRecord(
			'postType',
			postType,
			postId,
			{ meta: { [ CRDT_META_KEY ]: persisted[ CRDT_META_KEY ] } },
			{ undoIgnore: true }
		);
	}, [ isSaving, postId, postType, registry, editEntityRecord ] );
}
