import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { getFormsListQuery } from './use-forms-data.ts';
import type { FormListItem } from './use-forms-data.ts';
import type { View } from '@wordpress/dataviews/wp';

type CoreDispatch = {
	deleteEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		query?: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
};

type UseDeleteFormArgs = {
	view: View;
	setView: ( newView: View ) => void;
	recordsLength: number;
};

type UseDeleteFormReturn = {
	isDeleteConfirmDialogOpen: boolean;
	isDeleting: boolean;
	openDeleteConfirmDialog: ( item: FormListItem ) => void;
	closeDeleteConfirmDialog: () => void;
	onConfirmDelete: () => Promise< void >;
};

/**
 * Manage the "move form to trash" flow for the Forms list (confirmation state, REST delete, notices, cache invalidation).
 *
 * @param args               - Hook arguments.
 * @param args.view          - Current DataViews view (for page/perPage/search).
 * @param args.setView       - View setter (used to navigate to previous page when needed).
 * @param args.recordsLength - Number of records currently displayed (used for pagination edge case).
 *
 * @return State + handlers for opening/closing the confirm dialog and executing the trash operation.
 */
export default function useDeleteForm( {
	view,
	setView,
	recordsLength,
}: UseDeleteFormArgs ): UseDeleteFormReturn {
	const [ formPendingDelete, setFormPendingDelete ] = useState< FormListItem | null >( null );
	const [ isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );

	const { deleteEntityRecord, invalidateResolution } = useDispatch( 'core' ) as CoreDispatch;
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;
	const search = view.search ?? '';

	const currentQuery = useMemo(
		() => getFormsListQuery( page, perPage, search ),
		[ page, perPage, search ]
	);

	const openDeleteConfirmDialog = useCallback( ( item: FormListItem ) => {
		setFormPendingDelete( item );
		setIsDeleteConfirmDialogOpen( true );
	}, [] );

	const closeDeleteConfirmDialog = useCallback( () => {
		setIsDeleteConfirmDialogOpen( false );
		setFormPendingDelete( null );
	}, [] );

	const onConfirmDelete = useCallback( async () => {
		if ( ! formPendingDelete || isDeleting ) {
			return;
		}

		setIsDeleteConfirmDialogOpen( false );
		setIsDeleting( true );

		const shouldNavigateToPreviousPage = page > 1 && recordsLength === 1;

		try {
			await deleteEntityRecord(
				'postType',
				'jetpack_form',
				formPendingDelete.id,
				{ force: false },
				{ throwOnError: true }
			);

			createSuccessNotice( __( 'Form moved to trash.', 'jetpack-forms' ), {
				type: 'snackbar',
				id: 'delete-form',
			} );

			if ( shouldNavigateToPreviousPage ) {
				setView( { ...view, page: page - 1 } );
			}
		} catch {
			createErrorNotice( __( 'Could not move form to trash.', 'jetpack-forms' ), {
				type: 'snackbar',
				id: 'delete-form-error',
			} );
		} finally {
			setIsDeleting( false );
			setFormPendingDelete( null );

			// Invalidate the list query so the trashed form disappears from the table and totals refresh.
			invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', currentQuery ] );
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'jetpack_form',
				{ ...currentQuery, per_page: 1, _fields: 'id' },
			] );
		}
	}, [
		createErrorNotice,
		createSuccessNotice,
		currentQuery,
		deleteEntityRecord,
		formPendingDelete,
		invalidateResolution,
		isDeleting,
		page,
		recordsLength,
		setView,
		view,
	] );

	return {
		isDeleteConfirmDialogOpen,
		isDeleting,
		openDeleteConfirmDialog,
		closeDeleteConfirmDialog,
		onConfirmDelete,
	};
}
