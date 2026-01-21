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
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< unknown >;
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
	statusQuery: string;
};

type UseDeleteFormReturn = {
	isDeleting: boolean;
	trashForm: ( item: FormListItem ) => Promise< void >;
	restoreForm: ( item: FormListItem ) => Promise< void >;
};

/**
 * Manage the "move form to trash" flow for the Forms list (REST delete, notices, cache invalidation).
 *
 * @param args               - Hook arguments.
 * @param args.view          - Current DataViews view (for page/perPage/search).
 * @param args.setView       - View setter (used to navigate to previous page when needed).
 * @param args.recordsLength - Number of records currently displayed (used for pagination edge case).
 *
 * @param args.statusQuery   - REST `status` query param for the current list view (used for cache invalidation).
 * @return State + handler for executing the trash operation.
 */
export default function useDeleteForm( {
	view,
	setView,
	recordsLength,
	statusQuery,
}: UseDeleteFormArgs ): UseDeleteFormReturn {
	const [ isDeleting, setIsDeleting ] = useState( false );

	const { saveEntityRecord, deleteEntityRecord, invalidateResolution } = useDispatch(
		'core'
	) as CoreDispatch;
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;
	const search = view.search ?? '';

	const currentQuery = useMemo(
		() => getFormsListQuery( page, perPage, search, statusQuery ),
		[ page, perPage, search, statusQuery ]
	);

	const undoTrashForm = useCallback(
		async ( id: number, previousStatus: string ) => {
			try {
				await saveEntityRecord(
					'postType',
					'jetpack_form',
					{ id, status: previousStatus },
					{ throwOnError: true }
				);
				createSuccessNotice( __( 'Form restored.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: `restore-form-${ id }`,
				} );
			} catch {
				createErrorNotice( __( 'Could not restore form.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: `restore-form-error-${ id }`,
				} );
			} finally {
				invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', currentQuery ] );
				invalidateResolution( 'getEntityRecords', [
					'postType',
					'jetpack_form',
					{ ...currentQuery, per_page: 1, _fields: 'id' },
				] );
			}
		},
		[ createErrorNotice, createSuccessNotice, currentQuery, invalidateResolution, saveEntityRecord ]
	);

	const restoreForm = useCallback(
		async ( item: FormListItem ) => {
			if ( ! item || isDeleting ) {
				return;
			}

			setIsDeleting( true );

			try {
				await saveEntityRecord(
					'postType',
					'jetpack_form',
					{ id: item.id, status: 'publish' },
					{ throwOnError: true }
				);
				createSuccessNotice( __( 'Form restored.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: `restore-form-${ item.id }`,
				} );
			} catch {
				createErrorNotice( __( 'Could not restore form.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: `restore-form-error-${ item.id }`,
				} );
			} finally {
				setIsDeleting( false );
				invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', currentQuery ] );
				invalidateResolution( 'getEntityRecords', [
					'postType',
					'jetpack_form',
					{ ...currentQuery, per_page: 1, _fields: 'id' },
				] );
			}
		},
		[
			createErrorNotice,
			createSuccessNotice,
			currentQuery,
			invalidateResolution,
			isDeleting,
			saveEntityRecord,
		]
	);

	const trashForm = useCallback(
		async ( item: FormListItem ) => {
			if ( ! item || isDeleting ) {
				return;
			}

			const previousStatus = item.status;
			setIsDeleting( true );

			const shouldNavigateToPreviousPage = page > 1 && recordsLength === 1;

			try {
				await deleteEntityRecord(
					'postType',
					'jetpack_form',
					item.id,
					{ force: false },
					{ throwOnError: true }
				);

				createSuccessNotice( __( 'Form moved to trash.', 'jetpack-forms' ), {
					type: 'snackbar',
					id: `trash-form-${ item.id }`,
					actions: [
						{
							label: __( 'Undo', 'jetpack-forms' ),
							onClick: () => void undoTrashForm( item.id, previousStatus ),
						},
					],
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

				// Invalidate the list query so the trashed form disappears from the table and totals refresh.
				invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', currentQuery ] );
				invalidateResolution( 'getEntityRecords', [
					'postType',
					'jetpack_form',
					{ ...currentQuery, per_page: 1, _fields: 'id' },
				] );
			}
		},
		[
			createErrorNotice,
			createSuccessNotice,
			currentQuery,
			deleteEntityRecord,
			invalidateResolution,
			isDeleting,
			undoTrashForm,
			page,
			recordsLength,
			setView,
			view,
		]
	);

	return {
		isDeleting,
		trashForm,
		restoreForm,
	};
}
