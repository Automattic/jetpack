/**
 * External dependencies
 */
import { useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Fetches relevant entity record states for use in the configurator.
 *
 * @returns {object} relevant entity record values.
 */
export default function useEntityRecordState() {
	const { saveEntityRecord, undo, redo } = useDispatch( 'core' );
	const editedEntities = useSelect( select =>
		select( 'core' ).getEntityRecordEdits( 'root', 'site' )
	);
	const hasUnsavedEdits = editedEntities && Object.keys( editedEntities ).length > 0;

	const isSaving = useSelect( select => select( 'core' ).isSavingEntityRecord( 'root', 'site' ) );
	const hasRedo = useSelect( select => select( 'core' ).hasUndo() );
	const hasUndo = useSelect( select => select( 'core' ).hasRedo() );

	const saveRecords = useCallback( () => {
		hasUnsavedEdits && saveEntityRecord( 'root', 'site', editedEntities );
	}, [ editedEntities, hasUnsavedEdits, saveEntityRecord ] );

	return { editedEntities, hasRedo, hasUndo, hasUnsavedEdits, isSaving, redo, saveRecords, undo };
}
