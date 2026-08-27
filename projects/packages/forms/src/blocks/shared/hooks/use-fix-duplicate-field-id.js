import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { getRenamesForDuplicateId } from '../util/duplicate-ids.js';
import { getFormFieldEntries } from './use-form-field-ids.js';

/**
 * Get a function that makes one duplicated field id unique, on request.
 *
 * Deliberately an action rather than anything automatic: renaming a field changes the key its
 * responses are stored under, so it happens when an author asks for it and not as a side effect
 * of opening a dialog. What it writes is what the renderer was already producing for that form,
 * so nothing that names the base id changes meaning -- see `getRenamesForDuplicateId`.
 *
 * Reads the tree through the registry at call time, so nothing here subscribes to the store.
 *
 * @param {string} clientId - A field block inside the form to repair.
 * @return {Function} `( id ) => void`, renaming the later fields that claim `id`.
 */
const useFixDuplicateFieldId = clientId => {
	const registry = useRegistry();

	return useCallback(
		id => {
			const entries = getFormFieldEntries( registry.select, clientId );
			const renames = getRenamesForDuplicateId( entries, id );

			if ( ! renames.length ) {
				return;
			}

			// One dispatch, so the whole repair is a single undo step rather than one per field.
			registry.dispatch( blockEditorStore ).updateBlockAttributes(
				renames.map( rename => rename.clientId ),
				Object.fromEntries( renames.map( rename => [ rename.clientId, { id: rename.id } ] ) ),
				{ uniqueByBlock: true }
			);
		},
		[ registry, clientId ]
	);
};

export default useFixDuplicateFieldId;
