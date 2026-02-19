import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
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
	trashForms: ( items: FormListItem[] ) => Promise< void >;
	restoreForms: ( items: FormListItem[] ) => Promise< void >;
	isPermanentDeleteConfirmOpen: boolean;
	openPermanentDeleteConfirm: ( items: FormListItem[] ) => void;
	closePermanentDeleteConfirm: () => void;
	confirmPermanentDelete: () => Promise< void >;
};

/**
 * Manage the "move form to trash" flow for the Forms list (REST delete, notices, cache invalidation).
 *
 * @param args               - Hook arguments.
 * @param args.view          - Current DataViews view (for page/perPage/search).
 * @param args.setView       - View setter (used to navigate to previous page when needed).
 * @param args.recordsLength - Number of records currently displayed (used for pagination edge case).
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
	const [ isPermanentDeleteConfirmOpen, setIsPermanentDeleteConfirmOpen ] = useState( false );
	const [ permanentDeleteItems, setPermanentDeleteItems ] = useState< FormListItem[] >( [] );

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

	const invalidateListQueries = useCallback(
		( query: Record< string, unknown > ) => {
			invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', query ] );
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'jetpack_form',
				{ ...query, per_page: 1, _fields: 'id' },
			] );
		},
		[ invalidateResolution ]
	);

	const restoreItemsToPublish = useCallback(
		async (
			items: FormListItem[],
			{
				successNoticeIdPrefix,
				errorNoticeIdPrefix,
			}: { successNoticeIdPrefix: string; errorNoticeIdPrefix: string }
		): Promise< { restoredCount: number; failedCount: number } > => {
			const promises = await Promise.allSettled(
				items.map( item =>
					saveEntityRecord(
						'postType',
						'jetpack_form',
						{ id: item.id, status: 'publish' },
						{ throwOnError: true }
					)
				)
			);

			const restoredCount = promises.filter( p => p.status === 'fulfilled' ).length;
			const failedCount = promises.length - restoredCount;

			if ( restoredCount ) {
				const successMessage =
					restoredCount === 1
						? __( 'Form restored.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of forms. */
								_n( '%d form restored.', '%d forms restored.', restoredCount, 'jetpack-forms' ),
								restoredCount
						  );

				createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: `${ successNoticeIdPrefix }-${ Date.now() }`,
				} );
			}

			if ( failedCount ) {
				createErrorNotice(
					sprintf(
						/* translators: %d: number of forms. */
						_n(
							'Could not restore %d form.',
							'Could not restore %d forms.',
							failedCount,
							'jetpack-forms'
						),
						failedCount
					),
					{ type: 'snackbar', id: `${ errorNoticeIdPrefix }-${ Date.now() }` }
				);
			}

			return { restoredCount, failedCount };
		},
		[ createErrorNotice, createSuccessNotice, saveEntityRecord ]
	);

	const restoreForms = useCallback(
		async ( items: FormListItem[] ) => {
			if ( isDeleting || ! items?.length ) {
				return;
			}

			setIsDeleting( true );

			const currentQuerySnapshot = currentQuery;
			let shouldNavigateToPreviousPage = false;

			try {
				const { restoredCount } = await restoreItemsToPublish( items, {
					successNoticeIdPrefix: 'restore-forms',
					errorNoticeIdPrefix: 'restore-forms-error',
				} );

				// Only page back if we successfully restored all items on the current page.
				// If some restores fail, the page may still have items and navigating would be incorrect.
				shouldNavigateToPreviousPage = page > 1 && restoredCount >= recordsLength;
				if ( restoredCount && shouldNavigateToPreviousPage ) {
					setView( { ...view, page: page - 1 } );
				}
			} finally {
				setIsDeleting( false );

				// Invalidate the list query so restored forms disappear from the trash view and totals refresh.
				invalidateListQueries( currentQuerySnapshot );
				if ( shouldNavigateToPreviousPage ) {
					invalidateListQueries(
						getFormsListQuery( page - 1, perPage, search, statusQuery ) as Record< string, unknown >
					);
				}
			}
		},
		[
			currentQuery,
			invalidateListQueries,
			isDeleting,
			page,
			perPage,
			recordsLength,
			restoreItemsToPublish,
			search,
			setView,
			statusQuery,
			view,
		]
	);

	const undoTrashForms = useCallback(
		async ( items: FormListItem[] ) => {
			if ( isDeleting || ! items?.length ) {
				return;
			}

			setIsDeleting( true );
			const currentQuerySnapshot = currentQuery;

			try {
				await restoreItemsToPublish( items, {
					successNoticeIdPrefix: 'undo-trash-forms',
					errorNoticeIdPrefix: 'undo-trash-forms-error',
				} );
			} finally {
				setIsDeleting( false );
				invalidateListQueries( currentQuerySnapshot );
			}
		},
		[ currentQuery, invalidateListQueries, isDeleting, restoreItemsToPublish ]
	);

	const trashForms = useCallback(
		async ( items: FormListItem[] ) => {
			if ( isDeleting || ! items?.length ) {
				return;
			}

			setIsDeleting( true );

			const currentQuerySnapshot = currentQuery;
			let shouldNavigateToPreviousPage = false;

			try {
				const promises = await Promise.allSettled(
					items.map( item =>
						deleteEntityRecord(
							'postType',
							'jetpack_form',
							item.id,
							{ force: false },
							{ throwOnError: true }
						)
					)
				);

				const trashedItems = items.filter(
					( _, index ) => promises[ index ]?.status === 'fulfilled'
				);
				const trashedCount = trashedItems.length;
				const failedCount = items.length - trashedCount;

				if ( trashedCount ) {
					const successMessage =
						trashedCount === 1
							? __( 'Form moved to trash.', 'jetpack-forms' )
							: sprintf(
									/* translators: %d: number of forms. */
									_n(
										'%d form moved to trash.',
										'%d forms moved to trash.',
										trashedCount,
										'jetpack-forms'
									),
									trashedCount
							  );

					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: `trash-forms-${ Date.now() }`,
						actions: [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: () => void undoTrashForms( trashedItems ),
							},
						],
					} );

					// Only page back if we successfully trashed all items on the current page.
					// If some trash operations fail, the page may still have items and navigating would be incorrect.
					shouldNavigateToPreviousPage = page > 1 && trashedCount >= recordsLength;
					if ( shouldNavigateToPreviousPage ) {
						setView( { ...view, page: page - 1 } );
					}
				}

				if ( failedCount ) {
					createErrorNotice(
						sprintf(
							/* translators: %d: number of forms. */
							_n(
								'Could not move %d form to trash.',
								'Could not move %d forms to trash.',
								failedCount,
								'jetpack-forms'
							),
							failedCount
						),
						{ type: 'snackbar', id: `trash-forms-error-${ Date.now() }` }
					);
				}
			} finally {
				setIsDeleting( false );

				// Invalidate the list query so trashed forms disappear from the table and totals refresh.
				invalidateListQueries( currentQuerySnapshot );
				if ( shouldNavigateToPreviousPage ) {
					invalidateListQueries(
						getFormsListQuery( page - 1, perPage, search, statusQuery ) as Record< string, unknown >
					);
				}
			}
		},
		[
			createErrorNotice,
			createSuccessNotice,
			currentQuery,
			deleteEntityRecord,
			invalidateListQueries,
			isDeleting,
			page,
			perPage,
			recordsLength,
			search,
			setView,
			statusQuery,
			undoTrashForms,
			view,
		]
	);

	const openPermanentDeleteConfirm = useCallback( ( items: FormListItem[] ) => {
		setPermanentDeleteItems( items || [] );
		setIsPermanentDeleteConfirmOpen( true );
	}, [] );

	const closePermanentDeleteConfirm = useCallback( () => {
		setIsPermanentDeleteConfirmOpen( false );
		setPermanentDeleteItems( [] );
	}, [] );

	const confirmPermanentDelete = useCallback( async () => {
		if ( ! permanentDeleteItems.length || isDeleting ) {
			return;
		}

		setIsPermanentDeleteConfirmOpen( false );
		setIsDeleting( true );
		const currentQuerySnapshot = currentQuery;
		let shouldNavigateToPreviousPage = false;

		try {
			const promises = await Promise.allSettled(
				permanentDeleteItems.map( item =>
					deleteEntityRecord(
						'postType',
						'jetpack_form',
						item.id,
						{ force: true },
						{ throwOnError: true }
					)
				)
			);

			const deletedCount = promises.filter( p => p.status === 'fulfilled' ).length;
			const failedCount = promises.length - deletedCount;

			if ( deletedCount ) {
				const successMessage =
					deletedCount === 1
						? __( 'Form deleted permanently.', 'jetpack-forms' )
						: sprintf(
								/* translators: %d: number of forms. */
								_n(
									'%d form deleted permanently.',
									'%d forms deleted permanently.',
									deletedCount,
									'jetpack-forms'
								),
								deletedCount
						  );

				createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: `delete-forms-permanently-${ Date.now() }`,
				} );

				shouldNavigateToPreviousPage = page > 1 && deletedCount >= recordsLength;
				if ( shouldNavigateToPreviousPage ) {
					setView( { ...view, page: page - 1 } );
				}
			}

			if ( failedCount ) {
				createErrorNotice(
					sprintf(
						/* translators: %d: number of forms. */
						_n(
							'Could not permanently delete %d form.',
							'Could not permanently delete %d forms.',
							failedCount,
							'jetpack-forms'
						),
						failedCount
					),
					{ type: 'snackbar', id: `delete-forms-permanently-error-${ Date.now() }` }
				);
			}
		} catch {
			// Note: Promise.allSettled captures per-item failures; this is only for unexpected exceptions.
			createErrorNotice( __( 'Could not delete forms permanently.', 'jetpack-forms' ), {
				type: 'snackbar',
				id: `delete-forms-permanently-error-${ Date.now() }`,
			} );
		} finally {
			setIsDeleting( false );
			setPermanentDeleteItems( [] );

			// Invalidate the list query so the deleted forms disappear from the table and totals refresh.
			invalidateListQueries( currentQuerySnapshot );
			if ( shouldNavigateToPreviousPage ) {
				invalidateListQueries(
					getFormsListQuery( page - 1, perPage, search, statusQuery ) as Record< string, unknown >
				);
			}
		}
	}, [
		createErrorNotice,
		createSuccessNotice,
		currentQuery,
		deleteEntityRecord,
		invalidateListQueries,
		isDeleting,
		page,
		perPage,
		permanentDeleteItems,
		recordsLength,
		search,
		setView,
		statusQuery,
		view,
	] );

	return {
		isDeleting,
		trashForms,
		restoreForms,
		isPermanentDeleteConfirmOpen,
		openPermanentDeleteConfirm,
		closePermanentDeleteConfirm,
		confirmPermanentDelete,
	};
}
