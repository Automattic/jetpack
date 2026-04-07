/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { formatNumber } from '@automattic/number-formatters';
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useMemo, useState, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useSearch, useNavigate } from '@wordpress/route';
import { Badge } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import CreateFormButton from '../../src/dashboard/components/create-form-button/index.tsx';
import { EmptyWrapper, NoResults } from '../../src/dashboard/components/empty-responses/index.tsx';
import { FormNameModal } from '../../src/dashboard/components/form-name-modal';
import {
	FORM_STATUSES,
	NON_TRASH_FORM_STATUSES,
	getFormStatusLabel,
} from '../../src/dashboard/constants';
import useDeleteForm from '../../src/dashboard/hooks/use-delete-form.ts';
import useFormStatusCounts from '../../src/dashboard/hooks/use-form-status-counts.ts';
import useFormsData, { getFormsListQuery } from '../../src/dashboard/hooks/use-forms-data.ts';
import WpRouteDashboardSearchParamsProvider from '../../src/dashboard/router/wp-route-dashboard-search-params-provider.tsx';
import { getFormEditUrl } from '../../src/dashboard/utils.ts';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';
import FormsHelpModal from '../../src/dashboard/wp-build/components/forms-help-modal';
import useFormItemActions from '../../src/dashboard/wp-build/hooks/use-form-item-actions';
import usePageHeaderDetails from '../../src/dashboard/wp-build/hooks/use-page-header-details';
import { useRenameForm } from '../../src/dashboard/wp-build/hooks/use-rename-form';
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
	const [ isFormsHelpModalOpen, setIsFormsHelpModalOpen ] = useState( false );
	const integrations = useSelect(
		select => ( select( INTEGRATIONS_STORE ) as IntegrationsSelectors ).getIntegrations?.() ?? [],
		[]
	);
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const adminUrl = ( useConfigValue( 'adminUrl' ) as string ) || '';
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );
	const hasClassicForms = useConfigValue( 'hasClassicForms' );

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

	const hasResponsesQuery = useMemo( () => {
		const entriesFilterValue = view.filters?.find( filter => filter.field === 'entries' )?.value;
		if ( entriesFilterValue === 'has_responses' ) {
			return 'true';
		}
		if ( entriesFilterValue === 'no_responses' ) {
			return 'false';
		}
		return undefined;
	}, [ view.filters ] );

	const statusCounts = useFormStatusCounts();

	const { records, isLoading, totalItems, totalPages } = useFormsData(
		view.page ?? 1,
		view.perPage ?? 20,
		view.search ?? '',
		statusQuery,
		hasResponsesQuery
	);

	const {
		duplicateForm,
		previewForm,
		copyEmbed,
		copyShortcode,
		publishForms,
		setFormsToDraft,
		isUpdatingStatus,
	} = useFormItemActions();

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

	// Rename form
	const { renameFormItem, openRenameModal, closeRenameModal, handleRename } = useRenameForm();

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
				label: __( 'Responses', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) =>
					( item.entriesCount ?? 0 ) > 0 ? 'has_responses' : 'no_responses',
				render: ( { item }: { item: FormListItem } ) => formatNumber( item.entriesCount ?? 0 ),
				elements: [
					{ label: __( 'Has responses', 'jetpack-forms' ), value: 'has_responses' },
					{ label: __( 'No responses', 'jetpack-forms' ), value: 'no_responses' },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-forms' ),
				getValue: ( { item }: { item: FormListItem } ) => item.status,
				render: ( { item }: { item: FormListItem } ) => (
					<Badge intent="draft">{ getFormStatusLabel( item.status ) }</Badge>
				),
				elements: FORM_STATUSES.map( value => ( {
					value,
					label: sprintf(
						/* translators: 1: status name, 2: form count */
						__( '%1$s (%2$s)', 'jetpack-forms' ),
						getFormStatusLabel( value ),
						formatNumber( statusCounts[ value ] )
					),
				} ) ),
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
				filterBy: false,
			},
		],
		[ dateSettings.formats.datetime, statusCounts ]
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
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_view_responses_click', {
						source: 'forms_list',
					} );
					const [ item ] = items;
					if ( ! item ) {
						return;
					}
					openSingleFormView( item.id );
				},
			},
		];

		if ( isViewingTrash ) {
			actionsList.push( {
				id: 'restore-form',
				isPrimary: true,
				label: __( 'Restore', 'jetpack-forms' ),
				supportsBulk: true,
				async callback( items: FormListItem[] ) {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_restore_click', {
						source: 'forms_list',
						multiple: items.length > 1,
					} );
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
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_delete_permanently_click', {
						source: 'forms_list',
						multiple: items.length > 1,
					} );
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
			id: 'edit-form',
			isPrimary: true,
			label: __( 'Edit', 'jetpack-forms' ),
			supportsBulk: false,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_edit_form_click', {
					source: 'forms_list',
				} );
				const [ item ] = items;
				if ( ! item ) {
					return;
				}
				const editUrl = item.editUrl || getFormEditUrl( item.id, adminUrl );
				window.location.href = editUrl;
			},
		} );

		actionsList.push( {
			id: 'preview-form',
			isPrimary: false,
			label: __( 'Preview', 'jetpack-forms' ),
			supportsBulk: false,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_preview_click', {
					source: 'forms_list',
				} );
				const [ item ] = items;
				if ( item ) {
					await previewForm( item );
				}
			},
		} );

		if ( navigator?.clipboard ) {
			actionsList.push( {
				id: 'copy-embed',
				isPrimary: false,
				label: __( 'Copy embed', 'jetpack-forms' ),
				supportsBulk: false,
				async callback( items: FormListItem[] ) {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_copy_embed_click', {
						source: 'forms_list',
					} );
					const [ item ] = items;
					if ( item ) {
						await copyEmbed( item );
					}
				},
			} );

			actionsList.push( {
				id: 'copy-shortcode',
				isPrimary: false,
				label: __( 'Copy shortcode', 'jetpack-forms' ),
				supportsBulk: false,
				async callback( items: FormListItem[] ) {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_copy_shortcode_click', {
						source: 'forms_list',
					} );
					const [ item ] = items;
					if ( item ) {
						await copyShortcode( item );
					}
				},
			} );
		}
		const currentListQuery = getFormsListQuery(
			view.page ?? 1,
			view.perPage ?? 20,
			view.search ?? '',
			statusQuery
		) as Record< string, unknown >;
		const statusUpdateOptions = { invalidateQueries: [ currentListQuery ] };

		actionsList.push( {
			id: 'publish-form',
			isPrimary: false,
			label: __( 'Publish', 'jetpack-forms' ),
			isEligible: ( item: FormListItem ) => item.status !== 'publish',
			supportsBulk: true,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_publish_click', {
					source: 'forms_list',
					multiple: items.length > 1,
				} );
				if ( isDeleting || isUpdatingStatus ) {
					return;
				}
				const eligibleItems = ( items || [] ).filter( item => item.status !== 'publish' );
				if ( ! eligibleItems.length ) {
					return;
				}
				try {
					await publishForms( eligibleItems, statusUpdateOptions );
				} finally {
					setSelection( [] );
				}
			},
		} );

		actionsList.push( {
			id: 'unpublish-form',
			isPrimary: false,
			label: __( 'Unpublish', 'jetpack-forms' ),
			isEligible: ( item: FormListItem ) => item.status === 'publish',
			supportsBulk: true,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_unpublish_click', {
					source: 'forms_list',
					multiple: items.length > 1,
				} );
				if ( isDeleting || isUpdatingStatus ) {
					return;
				}
				const eligibleItems = ( items || [] ).filter( item => item.status === 'publish' );
				if ( ! eligibleItems.length ) {
					return;
				}
				try {
					await setFormsToDraft( eligibleItems, statusUpdateOptions );
				} finally {
					setSelection( [] );
				}
			},
		} );

		actionsList.push( {
			id: 'rename-form',
			isPrimary: false,
			label: __( 'Rename', 'jetpack-forms' ),
			supportsBulk: false,
			callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_rename_click', {
					source: 'forms_list',
				} );
				const [ item ] = items;
				if ( ! item ) {
					return;
				}
				openRenameModal( item );
			},
		} );

		actionsList.push( {
			id: 'duplicate-form',
			isPrimary: false,
			label: __( 'Duplicate', 'jetpack-forms' ),
			supportsBulk: false,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_duplicate_click', {
					source: 'forms_list',
				} );
				const [ item ] = items;
				if ( item ) {
					await duplicateForm( item );
				}
			},
		} );

		actionsList.push( {
			id: 'trash-form',
			isPrimary: false,
			label: __( 'Trash', 'jetpack-forms' ),
			supportsBulk: true,
			async callback( items: FormListItem[] ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_form_trash_click', {
					source: 'forms_list',
					multiple: items.length > 1,
				} );
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
		adminUrl,
		copyEmbed,
		copyShortcode,
		duplicateForm,
		isDeleting,
		isUpdatingStatus,
		isViewingTrash,
		onOpenPermanentDeleteConfirm,
		openRenameModal,
		openSingleFormView,
		publishForms,
		previewForm,
		restoreForms,
		setFormsToDraft,
		statusQuery,
		trashForms,
		view.page,
		view.perPage,
		view.search,
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
	const openFormsHelpModal = useCallback( () => {
		setIsFormsHelpModalOpen( true );
	}, [] );
	const closeFormsHelpModal = useCallback( () => {
		setIsFormsHelpModalOpen( false );
	}, [] );

	const {
		title,
		ariaLabel,
		breadcrumbs,
		subtitle,
		actions: headerActions,
	} = usePageHeaderDetails( {
		screen: 'forms',
		hasClassicForms: !! hasClassicForms,
		isIntegrationsEnabled: !! isIntegrationsEnabled,
		showDashboardIntegrations: !! showDashboardIntegrations,
		onOpenIntegrations: openIntegrationsModal,
		onOpenFormsHelp: openFormsHelpModal,
	} );
	const statusFilterValue = view.filters?.find( filter => filter.field === 'status' )?.value;
	const hasActiveFilters =
		!! view.search?.trim() || ( !! statusFilterValue && statusFilterValue !== 'all' );

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
			title={ title }
			ariaLabel={ ariaLabel }
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
					hasActiveFilters ? (
						<NoResults />
					) : (
						<EmptyWrapper
							heading={ __( "You're set up. No forms yet.", 'jetpack-forms' ) }
							body={ __(
								'Create a form to manage and reuse it across your site.',
								'jetpack-forms'
							) }
							actions={
								<HStack justify="center" spacing="2">
									<CreateFormButton
										label={ __( 'Create a new form', 'jetpack-forms' ) }
										variant="primary"
										showNameModal
									/>
									{ hasClassicForms && (
										<Button size="compact" variant="secondary" onClick={ openFormsHelpModal }>
											{ __( 'Not seeing all your forms?', 'jetpack-forms' ) }
										</Button>
									) }
								</HStack>
							}
						/>
					)
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
			<FormNameModal
				isOpen={ !! renameFormItem }
				onClose={ closeRenameModal }
				onSave={ handleRename }
				title={ __( 'Rename form', 'jetpack-forms' ) }
				initialValue={ renameFormItem?.title || '' }
			/>
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ closeIntegrationsModal }
				attributes={ undefined }
				setAttributes={ undefined }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
				context="dashboard"
			/>
			<FormsHelpModal isOpen={ isFormsHelpModalOpen } onClose={ closeFormsHelpModal } />
		</Page>
	);
}

const Stage = () => {
	return (
		<WpRouteDashboardSearchParamsProvider from="/forms">
			<StageInner />
		</WpRouteDashboardSearchParamsProvider>
	);
};

export { Stage as stage };
