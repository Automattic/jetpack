/**
 * Hook to manage the rename form modal state and save logic.
 *
 * Shared between the page header (use-page-header-details) and
 * the DataViews row actions (routes/forms/stage.tsx) so the rename
 * behavior stays consistent in one place.
 */

import { store as coreDataStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';

export interface RenameFormItem {
	id: number;
	title: string;
}

interface UseRenameFormReturn {
	/** The item currently being renamed, or null if the modal is closed. */
	renameFormItem: RenameFormItem | null;
	/** Open the rename modal for a given item. */
	openRenameModal: ( item: RenameFormItem ) => void;
	/** Close the rename modal. */
	closeRenameModal: () => void;
	/**
	 * Save handler for the FormNameModal.
	 * Resolves on success, throws on error (so the modal stays open).
	 */
	handleRename: ( newTitle: string ) => Promise< void >;
}

/**
 * Hook to manage the rename form modal state and save logic.
 *
 * @return {UseRenameFormReturn} Rename modal state and handlers.
 */
export function useRenameForm(): UseRenameFormReturn {
	const [ renameFormItem, setRenameFormItem ] = useState< RenameFormItem | null >( null );

	const { saveEntityRecord } = useDispatch( coreDataStore ) as {
		saveEntityRecord: (
			kind: string,
			name: string,
			record: Record< string, unknown >,
			options?: { throwOnError?: boolean }
		) => Promise< unknown >;
	};
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const openRenameModal = useCallback( ( item: RenameFormItem ) => {
		setRenameFormItem( item );
	}, [] );

	const closeRenameModal = useCallback( () => {
		setRenameFormItem( null );
	}, [] );

	const handleRename = useCallback(
		async ( newTitle: string ) => {
			if ( ! renameFormItem ) {
				return;
			}
			try {
				await saveEntityRecord(
					'postType',
					FORM_POST_TYPE,
					{
						id: renameFormItem.id,
						title: newTitle,
					},
					{ throwOnError: true }
				);

				createSuccessNotice( __( 'Form renamed.', 'jetpack-forms' ), { type: 'snackbar' } );
			} catch ( error ) {
				createErrorNotice( __( 'Failed to rename form.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				// eslint-disable-next-line no-console
				console.error( 'Failed to rename form:', error );
				throw error;
			}
		},
		[ renameFormItem, saveEntityRecord, createSuccessNotice, createErrorNotice ]
	);

	return {
		renameFormItem,
		openRenameModal,
		closeRenameModal,
		handleRename,
	};
}
