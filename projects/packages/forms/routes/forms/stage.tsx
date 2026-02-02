/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useMemo, useState, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import CreateFormButton from '../../src/dashboard/components/create-form-button/index.tsx';
import { EmptyWrapper } from '../../src/dashboard/components/empty-responses/index.tsx';
import FormsLogo from '../../src/dashboard/components/forms-logo';
import useDeleteForm from '../../src/dashboard/hooks/use-delete-form.ts';
import useFormsData from '../../src/dashboard/hooks/use-forms-data.ts';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';
import type { FormListItem } from '../../src/dashboard/hooks/use-forms-data.ts';
import type { Action, Operator, View } from '@wordpress/dataviews';

/**
 * Default DataViews config for the Forms list.
 */
const DEFAULT_VIEW: View = {
	type: 'table',
	search: '',
	filters: [ { field: 'status', operator: 'is', value: 'all' } ],
	page: 1,
	perPage: 20,
	titleField: 'title',
	fields: [ 'entries', 'status', 'modified' ],
};

const defaultLayouts = {
	table: {},
	list: {},
};

/**
 * Forms list route (wp-build).
 *
 * Note: For now, clicking a form or using the "View responses" action is intentionally a no-op.
 *
 * @return The stage content.
 */
function StageInner() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/forms' } );

	const dateSettings = getDateSettings();

	const [ view, setView ] = useState< View >( () => ( {
		...DEFAULT_VIEW,
		search: searchParams?.search || '',
	} ) );

	// Keep DataViews search in sync with the URL.
	useEffect( () => {
		const urlSearch = searchParams?.search || '';
		if ( urlSearch !== view.search ) {
			setView( previous => ( { ...previous, search: urlSearch } ) );
		}
	}, [ searchParams?.search ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const statusQuery = useMemo( () => {
		const statusFilterValue = view.filters?.find( filter => filter.field === 'status' )?.value;

		// Default: show all non-trash forms (matches WP core list behavior).
		const nonTrashStatuses = 'publish,draft,pending,future,private';

		if ( ! statusFilterValue || statusFilterValue === 'all' ) {
			return nonTrashStatuses;
		}

		return statusFilterValue as string;
	}, [ view.filters ] );

	const isViewingTrash = useMemo( () => {
		const statusFilterValue = view.filters?.find( filter => filter.field === 'status' )?.value;
		return statusFilterValue === 'trash';
	}, [ view.filters ] );

	const { records, isLoading, totalItems, totalPages } = useFormsData(
		view.page ?? 1,
		view.perPage ?? 20,
		view.search ?? '',
		statusQuery
	);

	const {
		isDeleting,
		trashForms,
		restoreForms,
		isPermanentDeleteConfirmOpen,
		openPermanentDeleteConfirm,
		closePermanentDeleteConfirm,
		confirmPermanentDelete,
	} = useDeleteForm( {
		view,
		setView,
		recordsLength: records?.length ?? 0,
		statusQuery,
	} );

	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ pendingPermanentDeleteCount, setPendingPermanentDeleteCount ] = useState( 0 );

	// Selection is local state. Clear it whenever the view changes (page/perPage/search/filters).
	useEffect( () => {
		setSelection( [] );
	}, [ view.page, view.perPage, view.search, view.filters ] );

	const onOpenPermanentDeleteConfirm = useCallback(
		( items: FormListItem[] ) => {
			setPendingPermanentDeleteCount( items?.length ?? 0 );
			openPermanentDeleteConfirm( items );
		},
		[ openPermanentDeleteConfirm ]
	);

	const onClosePermanentDeleteConfirm = useCallback( () => {
		setPendingPermanentDeleteCount( 0 );
		closePermanentDeleteConfirm();
	}, [ closePermanentDeleteConfirm ] );

	const onConfirmPermanentDelete = useCallback( async () => {
		setPendingPermanentDeleteCount( 0 );
		try {
			await confirmPermanentDelete();
		} finally {
			setSelection( [] );
		}
	}, [ confirmPermanentDelete ] );

	const statusLabel = useCallback( ( status: string ) => {
		switch ( status ) {
			case 'publish':
				return __( 'Published', 'jetpack-forms' );
			case 'draft':
				return __( 'Draft', 'jetpack-forms' );
			case 'pending':
				return __( 'Pending review', 'jetpack-forms' );
			case 'future':
				return __( 'Scheduled', 'jetpack-forms' );
			case 'private':
				return __( 'Private', 'jetpack-forms' );
			default:
				return status;
		}
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Form name', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.title,
				render: ( { item }: { item: FormListItem } ) =>
					item.title || __( '(no title)', 'jetpack-forms' ),
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'entries',
				label: __( 'Entries', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.entriesCount ?? 0,
				render: ( { item }: { item: FormListItem } ) => item.entriesCount ?? 0,
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.status,
				render: ( { item }: { item: FormListItem } ) => statusLabel( item.status ),
				elements: [
					{ label: __( 'All', 'jetpack-forms' ), value: 'all' },
					{ label: __( 'Published', 'jetpack-forms' ), value: 'publish' },
					{ label: __( 'Draft', 'jetpack-forms' ), value: 'draft' },
					{ label: __( 'Pending review', 'jetpack-forms' ), value: 'pending' },
					{ label: __( 'Scheduled', 'jetpack-forms' ), value: 'future' },
					{ label: __( 'Private', 'jetpack-forms' ), value: 'private' },
					{ label: __( 'Trash', 'jetpack-forms' ), value: 'trash' },
				],
				filterBy: { operators: [ 'is' ] as Operator[], isPrimary: true },
				enableSorting: false,
			},
			{
				id: 'modified',
				label: __( 'Last updated', 'jetpack-forms' ),
				type: 'date' as const,
				render: ( { item }: { item: FormListItem } ) =>
					dateI18n( dateSettings.formats.datetime, item.modified ),
				enableSorting: false,
			},
		],
		[ dateSettings.formats.datetime, statusLabel ]
	);

	const actions = useMemo( () => {
		const actionsList: Action< FormListItem >[] = [
			{
				id: 'view-responses',
				isPrimary: false,
				label: __( 'View responses', 'jetpack-forms' ),
				supportsBulk: false,
				callback() {
					// Intentionally no-op for now; single form screen will be added later.
				},
			},
			{
				id: 'edit-form',
				isPrimary: false,
				label: __( 'Edit', 'jetpack-forms' ),
				supportsBulk: false,
				async callback( items: FormListItem[] ) {
					const [ item ] = items;
					if ( ! item ) {
						return;
					}
					const fallbackEditUrl = `post.php?post=${ item.id }&action=edit&post_type=jetpack_form`;
					const editUrl = item.editUrl || fallbackEditUrl;
					const url = new URL( editUrl, window.location.origin );
					window.location.href = url.toString();
				},
			},
		];

		if ( isViewingTrash ) {
			actionsList.push( {
				id: 'restore-form',
				isPrimary: false,
				label: __( 'Restore', 'jetpack-forms' ),
				supportsBulk: true,
				async callback( items: FormListItem[] ) {
					if ( isDeleting ) {
						return;
					}
					try {
						await restoreForms( items );
					} finally {
						setSelection( [] );
					}
				},
			} );
			actionsList.push( {
				id: 'delete-form-permanently',
				isPrimary: false,
				label: __( 'Delete permanently', 'jetpack-forms' ),
				supportsBulk: true,
				async callback( items: FormListItem[] ) {
					if ( isDeleting ) {
						return;
					}
					if ( ! items?.length ) {
						return;
					}
					onOpenPermanentDeleteConfirm( items );
				},
			} );
			return actionsList;
		}

		actionsList.push( {
			id: 'trash-form',
			isPrimary: false,
			label: __( 'Trash', 'jetpack-forms' ),
			supportsBulk: true,
			async callback( items: FormListItem[] ) {
				if ( isDeleting ) {
					return;
				}
				try {
					await trashForms( items );
				} finally {
					setSelection( [] );
				}
			},
		} );

		return actionsList;
	}, [ isDeleting, isViewingTrash, onOpenPermanentDeleteConfirm, restoreForms, trashForms ] );

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems ?? 0,
			totalPages: totalPages ?? 0,
		} ),
		[ totalItems, totalPages ]
	);

	const onChangeView = useCallback(
		( newView: View ) => {
			setView( newView );

			// Sync DataViews search to the URL.
			if ( newView.search !== view.search ) {
				navigate( {
					search: {
						...searchParams,
						search: newView.search || undefined,
					},
				} );
			}
		},
		[ navigate, searchParams, view.search ]
	);

	const headerActions = useMemo( () => [ <CreateFormButton key="create" /> ], [] );
	const getItemId = useCallback( ( item: FormListItem ) => String( item.id ), [] );

	return (
		<Page
			showSidebarToggle={ false }
			title={ <FormsLogo /> }
			subTitle={ __( 'View and manage all your forms in one place.', 'jetpack-forms' ) }
			actions={ headerActions }
			hasPadding={ false }
		>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ records || [] }
				isLoading={ isLoading }
				empty={
					<EmptyWrapper
						heading={ __( "You're set up. No forms yet.", 'jetpack-forms' ) }
						body={ __(
							'Create a shared form pattern to manage and reuse it across your site.',
							'jetpack-forms'
						) }
						actions={
							<CreateFormButton
								label={ __( 'Create a new form', 'jetpack-forms' ) }
								variant="primary"
							/>
						}
					/>
				}
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ setSelection }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
			>
				<ConfirmDialog
					onCancel={ onClosePermanentDeleteConfirm }
					onConfirm={ onConfirmPermanentDelete }
					isOpen={ isPermanentDeleteConfirmOpen }
					confirmButtonText={ __( 'Delete permanently', 'jetpack-forms' ) }
				>
					<h3>{ __( 'Delete permanently', 'jetpack-forms' ) }</h3>
					<p>
						{ pendingPermanentDeleteCount === 1
							? __(
									'This will permanently delete this form. This action cannot be undone.',
									'jetpack-forms'
							  )
							: sprintf(
									/* translators: %d: number of forms */
									_n(
										'This will permanently delete %d form. This action cannot be undone.',
										'This will permanently delete %d forms. This action cannot be undone.',
										pendingPermanentDeleteCount,
										'jetpack-forms'
									),
									pendingPermanentDeleteCount
							  ) }
					</p>
				</ConfirmDialog>
				<DataViewsHeaderRow activeTab="forms" />
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
		</Page>
	);
}

const Stage = () => <StageInner />;

export { Stage as stage };
