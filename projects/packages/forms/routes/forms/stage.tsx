/**
 * External dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import {
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Button,
	Modal,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useMemo, useState, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useSearch, useNavigate } from '@wordpress/route';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import CreateFormButton from '../../src/dashboard/components/create-form-button/index.tsx';
import { EmptyWrapper } from '../../src/dashboard/components/empty-responses/index.tsx';
import { NON_TRASH_FORM_STATUSES } from '../../src/dashboard/constants';
import useDeleteForm from '../../src/dashboard/hooks/use-delete-form.ts';
import useFormsData, { getFormsListQuery } from '../../src/dashboard/hooks/use-forms-data.ts';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';
import usePageHeaderDetails from '../../src/dashboard/wp-build/hooks/use-page-header-details';
import '../../src/dashboard/wp-build/style.scss';
import useConfigValue from '../../src/hooks/use-config-value';
import { INTEGRATIONS_STORE, IntegrationsSelectors } from '../../src/store/integrations';
import './style.scss';
/**
 * Types
 */
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
	const [ isIntegrationsModalOpen, setIsIntegrationsModalOpen ] = useState( false );
	const integrations = useSelect(
		select => ( select( INTEGRATIONS_STORE ) as IntegrationsSelectors ).getIntegrations?.() ?? [],
		[]
	);
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );

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
		if ( ! statusFilterValue || statusFilterValue === 'all' ) {
			return NON_TRASH_FORM_STATUSES;
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

	// Rename modal state
	const [ isRenameModalOpen, setIsRenameModalOpen ] = useState( false );
	const [ renameFormItem, setRenameFormItem ] = useState< FormListItem | null >( null );
	const [ renameTitle, setRenameTitle ] = useState( '' );
	const [ isRenaming, setIsRenaming ] = useState( false );

	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { invalidateResolution } = useDispatch( coreStore );

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

	const openRenameModal = useCallback( ( item: FormListItem ) => {
		setRenameFormItem( item );
		setRenameTitle( item.title || '' );
		setIsRenameModalOpen( true );
	}, [] );

	const closeRenameModal = useCallback( () => {
		setIsRenameModalOpen( false );
		setRenameFormItem( null );
		setRenameTitle( '' );
	}, [] );

	const handleRename = useCallback( async () => {
		if ( ! renameFormItem || isRenaming ) {
			return;
		}

		setIsRenaming( true );
		const newTitle = renameTitle.trim() || __( 'Untitled Form', 'jetpack-forms' );

		try {
			await apiFetch( {
				path: `/wp/v2/jetpack-forms/${ renameFormItem.id }`,
				method: 'POST',
				data: { title: newTitle },
			} );

			// Invalidate the forms list cache to refresh the data
			const query = getFormsListQuery(
				view.page ?? 1,
				view.perPage ?? 20,
				view.search ?? '',
				statusQuery
			);
			invalidateResolution( 'getEntityRecords', [ 'postType', 'jetpack_form', query ] );

			createSuccessNotice( __( 'Form renamed.', 'jetpack-forms' ), { type: 'snackbar' } );
		} catch ( error ) {
			createErrorNotice( __( 'Failed to rename form. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			// eslint-disable-next-line no-console
			console.error( 'Failed to rename form:', error );
		} finally {
			setIsRenaming( false );
			closeRenameModal();
		}
	}, [
		renameFormItem,
		renameTitle,
		isRenaming,
		view.page,
		view.perPage,
		view.search,
		statusQuery,
		invalidateResolution,
		createSuccessNotice,
		createErrorNotice,
		closeRenameModal,
	] );

	const onRenameFormSubmit = useCallback(
		( event: React.FormEvent ) => {
			event.preventDefault();
			if ( isRenaming ) {
				return;
			}
			handleRename();
		},
		[ handleRename, isRenaming ]
	);

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

	const openSingleFormView = useCallback(
		( formId: number | string ) => {
			navigate( { href: `/responses/inbox?sourceId=${ encodeURIComponent( String( formId ) ) }` } );
		},
		[ navigate ]
	);

	const actions = useMemo( () => {
		const actionsList: Action< FormListItem >[] = [
			{
				id: 'view-responses',
				isPrimary: true,
				label: __( 'Responses', 'jetpack-forms' ),
				supportsBulk: false,
				callback( items: FormListItem[] ) {
					const [ item ] = items;
					if ( ! item ) {
						return;
					}
					openSingleFormView( item.id );
				},
			},
			{
				id: 'edit-form',
				isPrimary: true,
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
			{
				id: 'preview-form',
				isPrimary: false,
				label: __( 'Preview', 'jetpack-forms' ),
				supportsBulk: false,
				async callback( items: FormListItem[] ) {
					const [ item ] = items;
					if ( ! item ) {
						return;
					}

					try {
						const response = await apiFetch< { preview_url: string } >( {
							path: `/wp/v2/jetpack-forms/${ item.id }/preview-url`,
						} );
						window.open( response.preview_url, '_blank' );
					} catch ( error ) {
						// eslint-disable-next-line no-console
						console.error( 'Failed to get preview URL:', error );
					}
				},
			},
			{
				id: 'rename-form',
				isPrimary: false,
				label: __( 'Rename', 'jetpack-forms' ),
				supportsBulk: false,
				callback( items: FormListItem[] ) {
					const [ item ] = items;
					if ( ! item ) {
						return;
					}
					openRenameModal( item );
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
	}, [
		isDeleting,
		isViewingTrash,
		onOpenPermanentDeleteConfirm,
		openRenameModal,
		openSingleFormView,
		restoreForms,
		trashForms,
	] );

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

	const openIntegrationsModal = useCallback( () => {
		setIsIntegrationsModalOpen( true );
	}, [] );
	const closeIntegrationsModal = useCallback( () => {
		setIsIntegrationsModalOpen( false );
	}, [] );

	const {
		breadcrumbs,
		subtitle,
		actions: headerActions,
	} = usePageHeaderDetails( {
		screen: 'forms',
		isIntegrationsEnabled: !! isIntegrationsEnabled,
		showDashboardIntegrations: !! showDashboardIntegrations,
		onOpenIntegrations: openIntegrationsModal,
	} );
	const getItemId = useCallback( ( item: FormListItem ) => String( item.id ), [] );
	const onClickItem = useCallback(
		( item: FormListItem ) => {
			openSingleFormView( item.id );
		},
		[ openSingleFormView ]
	);

	return (
		<Page
			showSidebarToggle={ false }
			breadcrumbs={ breadcrumbs }
			subTitle={ subtitle }
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
								showIcon={ false }
							/>
						}
					/>
				}
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ setSelection }
				onClickItem={ onClickItem }
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
			{ isRenameModalOpen && (
				<Modal
					title={ __( 'Rename Form', 'jetpack-forms' ) }
					onRequestClose={ closeRenameModal }
					size="medium"
				>
					<form onSubmit={ onRenameFormSubmit }>
						<TextControl
							label={ __( 'Name', 'jetpack-forms' ) }
							value={ renameTitle }
							onChange={ setRenameTitle }
							__next40pxDefaultSize
						/>
						<div
							style={ {
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '8px',
								marginTop: '16px',
							} }
						>
							<Button variant="tertiary" onClick={ closeRenameModal }>
								{ __( 'Cancel', 'jetpack-forms' ) }
							</Button>
							<Button
								aria-disabled={ isRenaming }
								isBusy={ isRenaming }
								variant="primary"
								type="submit"
							>
								{ __( 'Save', 'jetpack-forms' ) }
							</Button>
						</div>
					</form>
				</Modal>
			) }
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ closeIntegrationsModal }
				attributes={ undefined }
				setAttributes={ undefined }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
				context="dashboard"
			/>
		</Page>
	);
}

const Stage = () => <StageInner />;

export { Stage as stage };
