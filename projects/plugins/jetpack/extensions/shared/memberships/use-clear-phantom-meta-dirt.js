import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';

// Post meta values are JSON-serializable, and a false negative only leaves an edit in
// place, so this is safe without pulling in a deep-equality dependency.
const isSameValue = ( a, b ) => JSON.stringify( a ) === JSON.stringify( b );

/**
 * Clears the phantom "unsaved changes" state that post meta edits leave behind on a site
 * with real-time collaboration enabled.
 *
 * Two things survive a save and keep the post dirty: collaboration serializes a fresh
 * `_crdt_document` into the payload after the edit was staged, and the server may return a
 * meta value it altered itself. core-data compares the whole `meta` object at once, so the
 * mismatched CRDT snapshot keeps every other key's edit alive with it and the post reads
 * "Save draft" forever — saving again just mints another snapshot.
 *
 * After a successful, non-autosave save, realign the keys that save already round-tripped
 * back to what the server stored. A key the writer changed while the save was in flight is
 * left alone, so a genuine unsaved change is never swallowed.
 *
 * No-op when collaboration is off, and no-op again once this is fixed upstream.
 *
 * @param {string} postType - Post type of the record being edited.
 * @param {number} postId   - ID of the record being edited.
 */
export default function useClearPhantomMetaDirt( postType, postId ) {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();
	const { isSaving, isAutosaving } = useSelect( select => {
		const { isSavingPost, isAutosavingPost } = select( editorStore );
		return { isSaving: isSavingPost(), isAutosaving: isAutosavingPost() };
	}, [] );
	const wasSavingRef = useRef( false );
	// Meta as it stood when the save started — i.e. what that request carried.
	const sentMetaRef = useRef( null );

	useEffect( () => {
		const startedSaving = ! wasSavingRef.current && isSaving;
		const finishedSaving = wasSavingRef.current && ! isSaving;
		wasSavingRef.current = isSaving;

		if ( ! postId || ! postType ) {
			return;
		}

		const { getEntityRecordEdits, getRawEntityRecord } = registry.select( coreDataStore );

		if ( startedSaving ) {
			// Autosaves don't carry meta, so realigning against one would revert the writer's
			// unsaved meta instead of reconciling it.
			sentMetaRef.current = isAutosaving
				? null
				: getEntityRecordEdits( 'postType', postType, postId )?.meta ?? null;
			return;
		}

		if ( ! finishedSaving ) {
			return;
		}

		const sentMeta = sentMetaRef.current;
		sentMetaRef.current = null;

		if ( ! sentMeta || ! registry.select( editorStore ).didPostSaveRequestSucceed() ) {
			return;
		}

		const stagedMeta = getEntityRecordEdits( 'postType', postType, postId )?.meta;
		const persistedMeta = getRawEntityRecord( 'postType', postType, postId )?.meta;

		if ( ! stagedMeta || ! persistedMeta ) {
			return;
		}

		const realigned = {};
		for ( const key of Object.keys( sentMeta ) ) {
			const staged = stagedMeta[ key ];
			// Changed again mid-save, so it is a real pending edit rather than save residue.
			if ( ! isSameValue( staged, sentMeta[ key ] ) ) {
				continue;
			}
			if ( isSameValue( staged, persistedMeta[ key ] ) ) {
				continue;
			}
			realigned[ key ] = persistedMeta[ key ];
		}

		// core-data compares the whole `meta` object, so a key the staged copy dropped keeps
		// the edit alive even when every shared value matches. `useSetAccess` drops the tier
		// key this way, and omitting a key never cleared it server-side to begin with.
		for ( const key of Object.keys( persistedMeta ) ) {
			if ( ! ( key in stagedMeta ) ) {
				realigned[ key ] = persistedMeta[ key ];
			}
		}

		if ( ! Object.keys( realigned ).length ) {
			return;
		}

		editEntityRecord( 'postType', postType, postId, { meta: realigned }, { undoIgnore: true } );
	}, [ isSaving, isAutosaving, postId, postType, registry, editEntityRecord ] );
}
