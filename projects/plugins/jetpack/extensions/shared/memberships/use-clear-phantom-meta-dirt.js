import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';

const isSame = ( a, b ) => JSON.stringify( a ) === JSON.stringify( b );

/**
 * Clears the phantom "unsaved changes" state a post meta edit leaves behind under real-time
 * collaboration. A fresh `_crdt_document` is serialized into the save payload after the edit was
 * staged, so core-data's whole-object `meta` comparison never matches and the post reads
 * "Save draft" forever. After a successful save, realign the keys that save round-tripped.
 * No-op when collaboration is off, and once this is fixed upstream.
 *
 * @param {string} postType - Post type being edited.
 * @param {number} postId   - Record ID being edited.
 */
export default function useClearPhantomMetaDirt( postType, postId ) {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const registry = useRegistry();
	const { isSaving, isAutosaving } = useSelect( select => {
		const { isSavingPost, isAutosavingPost } = select( editorStore );
		return { isSaving: isSavingPost(), isAutosaving: isAutosavingPost() };
	}, [] );
	const wasSavingRef = useRef( false );
	const sentMetaRef = useRef( null );

	useEffect( () => {
		const started = ! wasSavingRef.current && isSaving;
		const finished = wasSavingRef.current && ! isSaving;
		wasSavingRef.current = isSaving;

		if ( ! postId || ! postType ) {
			return;
		}

		const { getEntityRecordEdits, getRawEntityRecord } = registry.select( coreDataStore );

		if ( started ) {
			// Autosaves carry no meta, so reconciling against one would revert unsaved edits.
			sentMetaRef.current = isAutosaving
				? null
				: getEntityRecordEdits( 'postType', postType, postId )?.meta ?? null;
			return;
		}

		if ( ! finished ) {
			return;
		}

		const sentMeta = sentMetaRef.current;
		sentMetaRef.current = null;

		if ( ! sentMeta || ! registry.select( editorStore ).didPostSaveRequestSucceed() ) {
			return;
		}

		const staged = getEntityRecordEdits( 'postType', postType, postId )?.meta;
		const persisted = getRawEntityRecord( 'postType', postType, postId )?.meta;

		if ( ! staged || ! persisted ) {
			return;
		}

		const realigned = {};
		for ( const key of Object.keys( sentMeta ) ) {
			// Changed again mid-save: a real pending edit, not save residue.
			if ( ! isSame( staged[ key ], sentMeta[ key ] ) ) {
				continue;
			}
			if ( ! isSame( staged[ key ], persisted[ key ] ) ) {
				realigned[ key ] = persisted[ key ];
			}
		}
		// A key the staged copy dropped fails the whole-object comparison on its own.
		for ( const key of Object.keys( persisted ) ) {
			if ( ! ( key in staged ) ) {
				realigned[ key ] = persisted[ key ];
			}
		}

		if ( Object.keys( realigned ).length ) {
			editEntityRecord( 'postType', postType, postId, { meta: realigned }, { undoIgnore: true } );
		}
	}, [ isSaving, isAutosaving, postId, postType, registry, editEntityRecord ] );
}
