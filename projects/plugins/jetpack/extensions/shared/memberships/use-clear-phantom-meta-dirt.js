import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';

const CRDT_DOC_META_KEY = '_crdt_document';

/**
 * Clears the phantom "unsaved changes" state that any post meta edit leaves behind on a
 * site with real-time collaboration enabled.
 *
 * Collaboration serializes a fresh CRDT snapshot into `meta._crdt_document` on the save
 * payload, after the meta edit was staged. The staged meta then matches neither the
 * response record nor the sent edits, so core-data's edits reducer keeps it and the post
 * reads "Save draft" forever — saving again just mints another snapshot. Realigning that
 * one key against the persisted record lets the reducer drop the edit. Any other meta key
 * that genuinely differs keeps its edit, so a real unsaved change is never swallowed.
 *
 * No-op when collaboration is off, and no-op again once this is fixed upstream.
 *
 * @param {string} postType - Post type of the record being edited.
 * @param {number} postId   - ID of the record being edited.
 */
export default function useClearPhantomMetaDirt( postType, postId ) {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();
	const isSavingPost = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSavingRef = useRef( false );

	useEffect( () => {
		const finishedSaving = wasSavingRef.current && ! isSavingPost;
		wasSavingRef.current = isSavingPost;

		if ( ! finishedSaving || ! postId || ! postType ) {
			return;
		}

		const { getEntityRecordEdits, getRawEntityRecord } = registry.select( coreDataStore );
		const stagedMeta = getEntityRecordEdits( 'postType', postType, postId )?.meta;
		const persistedDoc = getRawEntityRecord( 'postType', postType, postId )?.meta?.[
			CRDT_DOC_META_KEY
		];

		if ( ! stagedMeta || stagedMeta[ CRDT_DOC_META_KEY ] === persistedDoc ) {
			return;
		}

		editEntityRecord(
			'postType',
			postType,
			postId,
			{ meta: { [ CRDT_DOC_META_KEY ]: persistedDoc } },
			{ undoIgnore: true }
		);
	}, [ isSavingPost, postId, postType, registry, editEntityRecord ] );
}
