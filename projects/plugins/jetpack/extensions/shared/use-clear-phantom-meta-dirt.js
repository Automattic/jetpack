import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

// Not exported by @wordpress/core-data; see its utils/crdt.
const CRDT_META_KEY = '_crdt_document';

/**
 * Clears the phantom "unsaved changes" state a post meta edit leaves behind under real-time
 * collaboration. A fresh `_crdt_document` is serialized into the save payload after the edit was
 * staged, so core-data's whole-object `meta` comparison never matches and the post reads
 * "Save draft" forever. After a successful save, realign that key against the persisted record.
 * No-op when collaboration is off, and once this is fixed upstream.
 *
 * Leans on core-data internals: `mergedEdits.meta` on the postType entity, edits equal to the
 * persisted record being dropped, and `_crdt_document` being a disallowed sync key.
 *
 * @param {string} postType - Post type being edited.
 * @param {number} postId   - Record ID being edited.
 */
export default function useClearPhantomMetaDirt( postType, postId ) {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();
	// Nothing else ever moves this key: peers never sync it, and only a non-autosave save runs the
	// `prePersist` that mints a new one. So its changing is the signal that a save round-tripped.
	const persistedCrdt = useSelect(
		select => {
			if ( ! postType || ! postId ) {
				return undefined;
			}
			const record = select( coreDataStore ).getRawEntityRecord( 'postType', postType, postId );
			return record?.meta?.[ CRDT_META_KEY ];
		},
		[ postType, postId ]
	);

	useEffect( () => {
		if ( ! persistedCrdt ) {
			return;
		}

		const staged = registry
			.select( coreDataStore )
			.getEntityRecordEdits( 'postType', postType, postId )?.meta;

		if ( ! staged || staged[ CRDT_META_KEY ] === persistedCrdt ) {
			return;
		}

		// Only the CRDT blob: nothing in the editor edits it, so adopting the persisted copy cannot
		// discard a pending change. Every other difference is left alone, because a key the server
		// altered is indistinguishable from one the writer edited or dropped mid-save.
		editEntityRecord(
			'postType',
			postType,
			postId,
			{ meta: { [ CRDT_META_KEY ]: persistedCrdt } },
			{ undoIgnore: true }
		);
	}, [ persistedCrdt, postType, postId, registry, editEntityRecord ] );
}
