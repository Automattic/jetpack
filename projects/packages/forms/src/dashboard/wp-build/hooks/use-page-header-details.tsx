/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Breadcrumbs } from '@wordpress/admin-ui';
import {
	DropdownMenu,
	Button,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useState, useCallback, useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useNavigate } from '@wordpress/route';
import { Badge, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';
import useConfigValue from '../../../hooks/use-config-value';
import CreateFormButton from '../../components/create-form-button';
import EditFormButton from '../../components/edit-form-button';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptySpamConfirmationModal from '../../components/empty-spam-button/confirmation-modal';
import EmptyTrashButton from '../../components/empty-trash-button';
import EmptyTrashConfirmationModal from '../../components/empty-trash-button/confirmation-modal';
import ExportResponsesButton from '../../components/export-responses/button';
import ExportResponsesModal from '../../components/export-responses/modal';
import { FormNameModal } from '../../components/form-name-modal';
import { getFormStatusLabel } from '../../constants';
import useCreateForm from '../../hooks/use-create-form';
import useEmptySpam from '../../hooks/use-empty-spam';
import useEmptyTrash from '../../hooks/use-empty-trash';
import useExportResponses from '../../hooks/use-export-responses';
import useInboxData from '../../hooks/use-inbox-data';
import { store as dashboardStore } from '../../store/index.js';
import { getFormEditUrl } from '../../utils.ts';
import ManageIntegrationsButton from '../components/manage-integrations-button';
import useFormItemActions from './use-form-item-actions';
import { useRenameForm } from './use-rename-form';
import type { ReactNode } from 'react';

type ResponsesStatusView = 'inbox' | 'spam' | 'trash';

type UsePageHeaderDetailsProps = {
	screen: 'forms' | 'responses';
	statusView?: ResponsesStatusView;
	sourceId?: string | number;
	hasClassicForms?: boolean;
	isIntegrationsEnabled: boolean;
	showDashboardIntegrations: boolean;
	onOpenIntegrations: () => void;
	onOpenFormsHelp?: () => void;
};

type UsePageHeaderDetailsReturn = {
	ariaLabel: string;
	breadcrumbs: ReactNode;
	title?: ReactNode;
	badges?: ReactNode;
	subtitle: ReactNode;
	actions?: ReactNode;
};

/**
 * Build wp-build page header details (breadcrumbs, subtitle, actions).
 *
 * This hook is intentionally scoped to just what is passed into the wp-build `<Page />`
 * component to keep route files readable.
 *
 * @param props - Props.
 * @return Page header details.
 */
export default function usePageHeaderDetails(
	props: UsePageHeaderDetailsProps
): UsePageHeaderDetailsReturn {
	const {
		screen,
		sourceId,
		hasClassicForms,
		isIntegrationsEnabled,
		showDashboardIntegrations,
		onOpenIntegrations,
		onOpenFormsHelp,
	} = props;
	const adminUrl = ( useConfigValue( 'adminUrl' ) as string ) || '';
	const statusView: ResponsesStatusView = props.statusView ?? 'inbox';
	const sourceIdNumber = useMemo( () => {
		const value = sourceId;
		const numberValue = typeof value === 'number' ? value : Number( value );
		return Number.isFinite( numberValue ) && numberValue > 0 ? numberValue : null;
	}, [ sourceId ] );

	// Detect mobile viewport
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const navigate = useNavigate();

	// Mutually-exclusive screen flags.
	const isFormsScreen = screen === 'forms';
	const isSingleFormScreen = screen === 'responses' && sourceIdNumber !== null;

	// Hooks for mobile dropdown menu actions
	const { openNewForm } = useCreateForm();
	const [ isCreateFormModalOpen, setIsCreateFormModalOpen ] = useState( false );
	const handleCreateFormClick = useCallback( () => {
		setIsCreateFormModalOpen( true );
	}, [] );
	const closeCreateFormModal = useCallback( () => setIsCreateFormModalOpen( false ), [] );
	const handleCreateFormSave = useCallback(
		async ( formName: string ) => {
			await openNewForm( { formTitle: formName } );
		},
		[ openNewForm ]
	);
	const {
		showExportModal,
		openModal: openExportModal,
		closeModal: closeExportModal,
		onExport,
		autoConnectGdrive,
		exportLabel,
	} = useExportResponses();
	const { totalItems, isLoadingData } = useInboxData();
	const hasResponses = ! isLoadingData && totalItems > 0;

	// Empty spam/trash hooks
	const emptySpam = useEmptySpam();
	const emptyTrash = useEmptyTrash();

	// Permanent delete confirmation state
	const [ isPermanentDeleteConfirmOpen, setIsPermanentDeleteConfirmOpen ] = useState( false );
	const permanentDeleteItemRef = useRef< { id: number } | null >( null );

	// Rename form
	const { renameFormItem, openRenameModal, closeRenameModal, handleRename } = useRenameForm();
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreDataStore ) as {
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
	};
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { invalidateFormStatusCounts } = useDispatch( dashboardStore );

	const formRecord = useSelect(
		select => {
			if ( ! sourceIdNumber ) {
				return undefined;
			}
			const record = select( coreDataStore ).getEntityRecord(
				'postType',
				'jetpack_form',
				sourceIdNumber
			) as { title?: { rendered?: string }; status?: string } | undefined;
			return record;
		},
		[ sourceIdNumber ]
	);

	const formTitle = useMemo( () => {
		const rendered = formRecord?.title?.rendered || '';
		return decodeEntities( rendered );
	}, [ formRecord?.title?.rendered ] );

	const trashForm = useCallback(
		async ( item: { id: number } ) => {
			const previousStatus = formRecord?.status || 'draft';
			try {
				await deleteEntityRecord(
					'postType',
					FORM_POST_TYPE,
					item.id,
					{ force: false },
					{ throwOnError: true }
				);

				invalidateFormStatusCounts();
				createSuccessNotice( __( 'Form moved to trash.', 'jetpack-forms' ), {
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo', 'jetpack-forms' ),
							onClick: () => {
								saveEntityRecord(
									'postType',
									FORM_POST_TYPE,
									{ id: item.id, status: previousStatus },
									{ throwOnError: true }
								)
									.then( () => {
										invalidateFormStatusCounts();
										createSuccessNotice( __( 'Form restored.', 'jetpack-forms' ), {
											type: 'snackbar',
										} );
									} )
									.catch( () => {
										createErrorNotice( __( 'Could not restore form.', 'jetpack-forms' ), {
											type: 'snackbar',
										} );
									} );
							},
						},
					],
				} );

				// Navigate back to the forms list since the form no longer exists.
				navigate( { to: '/forms' } );
			} catch ( error ) {
				createErrorNotice( __( 'Failed to move form to trash.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				// eslint-disable-next-line no-console
				console.error( 'Failed to trash form:', error );
			}
		},
		[
			deleteEntityRecord,
			formRecord?.status,
			invalidateFormStatusCounts,
			createSuccessNotice,
			createErrorNotice,
			saveEntityRecord,
			navigate,
		]
	);

	const restoreForm = useCallback(
		async ( item: { id: number } ) => {
			try {
				await saveEntityRecord(
					'postType',
					FORM_POST_TYPE,
					{ id: item.id, status: 'publish' },
					{ throwOnError: true }
				);

				invalidateFormStatusCounts();
				createSuccessNotice( __( 'Form restored.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch ( error ) {
				createErrorNotice( __( 'Could not restore form.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				// eslint-disable-next-line no-console
				console.error( 'Failed to restore form:', error );
			}
		},
		[ saveEntityRecord, invalidateFormStatusCounts, createSuccessNotice, createErrorNotice ]
	);

	const openPermanentDeleteConfirm = useCallback( ( item: { id: number } ) => {
		permanentDeleteItemRef.current = item;
		setIsPermanentDeleteConfirmOpen( true );
	}, [] );

	const closePermanentDeleteConfirm = useCallback( () => {
		setIsPermanentDeleteConfirmOpen( false );
		permanentDeleteItemRef.current = null;
	}, [] );

	const confirmPermanentDelete = useCallback( async () => {
		const item = permanentDeleteItemRef.current;
		if ( ! item ) {
			return;
		}
		setIsPermanentDeleteConfirmOpen( false );
		permanentDeleteItemRef.current = null;

		try {
			await deleteEntityRecord(
				'postType',
				FORM_POST_TYPE,
				item.id,
				{ force: true },
				{ throwOnError: true }
			);

			invalidateFormStatusCounts();
			createSuccessNotice( __( 'Form deleted permanently.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			navigate( { to: '/forms' } );
		} catch ( error ) {
			createErrorNotice( __( 'Could not delete form.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			// eslint-disable-next-line no-console
			console.error( 'Failed to permanently delete form:', error );
		}
	}, [
		deleteEntityRecord,
		invalidateFormStatusCounts,
		createSuccessNotice,
		createErrorNotice,
		navigate,
	] );

	const formStatus = formRecord?.status;

	const statusLabel = formStatus ? getFormStatusLabel( formStatus ) : undefined;

	const badges = useMemo( () => {
		if ( ! isSingleFormScreen || ! formStatus || formStatus === 'publish' ) {
			return undefined;
		}
		return <Badge intent="draft">{ statusLabel }</Badge>;
	}, [ isSingleFormScreen, formStatus, statusLabel ] );

	const {
		duplicateForm,
		previewForm,
		copyEmbed,
		copyShortcode,
		publishForms,
		setFormsToDraft,
		isUpdatingStatus,
	} = useFormItemActions();

	const trackAction = useCallback( ( eventName: string, source = 'form_header' ) => {
		jetpackAnalytics.tracks.recordEvent( eventName, {
			source,
		} );
	}, [] );

	const formItemControls = useMemo( () => {
		if ( ! sourceIdNumber ) {
			return [];
		}

		const formItem = { id: sourceIdNumber, title: formTitle, status: formRecord?.status };

		if ( formRecord?.status === 'trash' ) {
			return [
				{
					title: __( 'Restore', 'jetpack-forms' ),
					onClick: () => {
						trackAction( 'jetpack_forms_form_restore_click' );
						restoreForm( formItem );
					},
				},
				{
					title: __( 'Delete permanently', 'jetpack-forms' ),
					onClick: () => {
						trackAction( 'jetpack_forms_form_delete_permanently_click' );
						openPermanentDeleteConfirm( formItem );
					},
				},
			];
		}

		const controls: Array< { title: string; onClick: () => void } > = [
			{
				title: __( 'Preview', 'jetpack-forms' ),
				onClick: () => {
					trackAction( 'jetpack_forms_form_preview_click' );
					previewForm( formItem );
				},
			},
		];

		if ( navigator?.clipboard ) {
			controls.push(
				{
					title: __( 'Copy embed', 'jetpack-forms' ),
					onClick: () => {
						trackAction( 'jetpack_forms_form_copy_embed_click' );
						copyEmbed( formItem );
					},
				},
				{
					title: __( 'Copy shortcode', 'jetpack-forms' ),
					onClick: () => {
						trackAction( 'jetpack_forms_form_copy_shortcode_click' );
						copyShortcode( formItem );
					},
				}
			);
		}

		if ( formRecord?.status === 'publish' ) {
			controls.push( {
				title: __( 'Unpublish', 'jetpack-forms' ),
				onClick: () => {
					if ( ! isUpdatingStatus ) {
						trackAction( 'jetpack_forms_form_unpublish_click' );
						setFormsToDraft( [ formItem ] );
					}
				},
			} );
		} else {
			controls.push( {
				title: __( 'Publish', 'jetpack-forms' ),
				onClick: () => {
					if ( ! isUpdatingStatus ) {
						trackAction( 'jetpack_forms_form_publish_click' );
						publishForms( [ formItem ] );
					}
				},
			} );
		}

		controls.push(
			{
				title: __( 'Rename', 'jetpack-forms' ),
				onClick: () => {
					trackAction( 'jetpack_forms_form_rename_click' );
					openRenameModal( formItem );
				},
			},
			{
				title: __( 'Duplicate', 'jetpack-forms' ),
				onClick: () => {
					trackAction( 'jetpack_forms_form_duplicate_click' );
					duplicateForm( formItem );
				},
			},
			{
				title: __( 'Trash', 'jetpack-forms' ),
				onClick: () => {
					trackAction( 'jetpack_forms_form_trash_click' );
					trashForm( formItem );
				},
			}
		);

		return controls;
	}, [
		copyEmbed,
		copyShortcode,
		duplicateForm,
		trashForm,
		restoreForm,
		openPermanentDeleteConfirm,
		formRecord?.status,
		formTitle,
		isUpdatingStatus,
		publishForms,
		previewForm,
		setFormsToDraft,
		sourceIdNumber,
		openRenameModal,
		trackAction,
	] );

	const WrapWithJetpackLogo = ( { children }: { children: ReactNode } ) => (
		<Stack align="center" gap="xs">
			<JetpackLogo showText={ false } width={ 20 } />
			{ children }
		</Stack>
	);

	const ariaLabel = useMemo( () => {
		if ( isSingleFormScreen ) {
			return formTitle || __( 'Form responses', 'jetpack-forms' );
		}
		// "Forms" is a product name, do not translate.
		return 'Jetpack Forms';
	}, [ isSingleFormScreen, formTitle ] );

	const title = useMemo( () => {
		if ( isSingleFormScreen ) {
			return null;
		}
		// "Forms" is a product name, do not translate.
		return <WrapWithJetpackLogo>Forms</WrapWithJetpackLogo>;
	}, [ isSingleFormScreen ] );

	const breadcrumbs = useMemo( () => {
		if ( ! isSingleFormScreen ) {
			return null;
		}

		return (
			<WrapWithJetpackLogo>
				<Breadcrumbs
					items={ [
						{ label: __( 'Forms', 'jetpack-forms' ), to: '/forms' },
						{ label: formTitle || __( 'Form responses', 'jetpack-forms' ) },
					] }
				/>
			</WrapWithJetpackLogo>
		);
	}, [ isSingleFormScreen, formTitle ] );

	const subtitle = useMemo( () => {
		if ( isFormsScreen ) {
			const shortMessage = __( 'View and manage all your forms.', 'jetpack-forms' );
			const longMessage = __( 'View and manage all your forms in one place.', 'jetpack-forms' );

			return hasClassicForms ? (
				<>
					{ shortMessage }{ ' ' }
					<Button variant="link" onClick={ onOpenFormsHelp }>
						{ __( 'Not seeing all your forms?', 'jetpack-forms' ) }
					</Button>
				</>
			) : (
				longMessage
			);
		}

		if ( isSingleFormScreen ) {
			if ( formTitle ) {
				return sprintf(
					/* translators: %s: form name */
					__( 'View responses for %s.', 'jetpack-forms' ),
					formTitle
				);
			}
			return __( 'View responses for this form.', 'jetpack-forms' );
		}

		return __( 'View and manage all your form responses in one place.', 'jetpack-forms' );
	}, [ formTitle, isFormsScreen, isSingleFormScreen, onOpenFormsHelp, hasClassicForms ] );

	const trackEditFormClick = useCallback(
		() => trackAction( 'jetpack_forms_form_edit_form_click' ),
		[ trackAction ]
	);
	const trackExportClick = useCallback(
		() => trackAction( 'jetpack_forms_form_export_click' ),
		[ trackAction ]
	);
	const trackExportClickResponsesList = useCallback(
		() => trackAction( 'jetpack_forms_form_export_click', 'responses_list' ),
		[ trackAction ]
	);

	const actions = useMemo( () => {
		// Mobile: show dropdown menu with actions
		if ( isSm ) {
			const dropdownControls = [];

			if ( isFormsScreen ) {
				// Forms screen: Manage integrations, Create a form
				if ( isIntegrationsEnabled && showDashboardIntegrations ) {
					dropdownControls.push( {
						onClick: onOpenIntegrations,
						title: __( 'Manage integrations', 'jetpack-forms' ),
					} );
				}

				dropdownControls.push( {
					onClick: handleCreateFormClick,
					title: __( 'Create a form', 'jetpack-forms' ),
				} );
			} else if ( isSingleFormScreen ) {
				// Single form screen: Edit form (not in trash/spam), Export, Empty trash/spam
				if ( statusView === 'inbox' && sourceIdNumber ) {
					dropdownControls.push( {
						onClick: () => {
							trackAction( 'jetpack_forms_form_edit_form_click' );
							window.location.href = getFormEditUrl( sourceIdNumber, adminUrl );
						},
						title: __( 'Edit form', 'jetpack-forms' ),
					} );
				}
				dropdownControls.push( {
					onClick: () => {
						trackAction( 'jetpack_forms_form_export_click' );
						openExportModal();
					},
					title: exportLabel,
					isDisabled: ! hasResponses,
				} );

				if ( statusView === 'trash' ) {
					dropdownControls.push( {
						onClick: emptyTrash.openConfirmDialog,
						title: __( 'Empty trash', 'jetpack-forms' ),
						isDisabled: emptyTrash.isEmpty || emptyTrash.isEmptying,
					} );
				}

				if ( statusView === 'spam' ) {
					dropdownControls.push( {
						onClick: emptySpam.openConfirmDialog,
						title: __( 'Delete spam', 'jetpack-forms' ),
						isDisabled: emptySpam.isEmpty || emptySpam.isEmptying,
					} );
				}

				dropdownControls.push( ...formItemControls );
			} else {
				// Responses list screen: Manage integrations (inbox only), Create a form (inbox only), Export, Empty trash/spam
				if ( statusView === 'inbox' && isIntegrationsEnabled && showDashboardIntegrations ) {
					dropdownControls.push( {
						onClick: onOpenIntegrations,
						title: __( 'Manage integrations', 'jetpack-forms' ),
					} );
				}

				if ( statusView === 'inbox' ) {
					dropdownControls.push( {
						onClick: handleCreateFormClick,
						title: __( 'Create a form', 'jetpack-forms' ),
					} );
				}

				dropdownControls.push( {
					onClick: () => {
						trackAction( 'jetpack_forms_form_export_click', 'responses_list' );
						openExportModal();
					},
					title: exportLabel,
					isDisabled: ! hasResponses,
				} );

				if ( statusView === 'trash' ) {
					dropdownControls.push( {
						onClick: emptyTrash.openConfirmDialog,
						title: __( 'Empty trash', 'jetpack-forms' ),
						isDisabled: emptyTrash.isEmpty || emptyTrash.isEmptying,
					} );
				}

				if ( statusView === 'spam' ) {
					dropdownControls.push( {
						onClick: emptySpam.openConfirmDialog,
						title: __( 'Delete spam', 'jetpack-forms' ),
						isDisabled: emptySpam.isEmpty || emptySpam.isEmptying,
					} );
				}
			}

			if ( dropdownControls.length === 0 ) {
				return null;
			}

			return [
				<DropdownMenu
					key="actions-menu"
					controls={ dropdownControls }
					icon={ moreVertical }
					label={ __( 'More actions', 'jetpack-forms' ) }
					toggleProps={ { size: 'compact' } }
				/>,
				// Include modals when on mobile
				...( isCreateFormModalOpen
					? [
							<FormNameModal
								key="create-form-modal"
								isOpen={ isCreateFormModalOpen }
								onClose={ closeCreateFormModal }
								onSave={ handleCreateFormSave }
								title={ __( 'Create form', 'jetpack-forms' ) }
								primaryButtonLabel={ __( 'Create', 'jetpack-forms' ) }
								secondaryButtonLabel={ __( 'Cancel', 'jetpack-forms' ) }
								placeholder={ __( 'Enter form title', 'jetpack-forms' ) }
							/>,
					  ]
					: [] ),
				...( showExportModal
					? [
							<ExportResponsesModal
								key="export-modal"
								onRequestClose={ closeExportModal }
								onExport={ onExport }
								autoConnectGdrive={ autoConnectGdrive }
							/>,
					  ]
					: [] ),
				...( emptyTrash.isConfirmDialogOpen
					? [
							<EmptyTrashConfirmationModal
								key="empty-trash-confirm"
								isOpen={ emptyTrash.isConfirmDialogOpen }
								onCancel={ emptyTrash.closeConfirmDialog }
								onConfirm={ emptyTrash.onConfirmEmptying }
								totalItemsTrash={ emptyTrash.totalItemsTrash }
								selectedResponsesCount={ emptyTrash.selectedResponsesCount }
							/>,
					  ]
					: [] ),
				...( emptySpam.isConfirmDialogOpen
					? [
							<EmptySpamConfirmationModal
								key="empty-spam-confirm"
								isOpen={ emptySpam.isConfirmDialogOpen }
								onCancel={ emptySpam.closeConfirmDialog }
								onConfirm={ emptySpam.onConfirmEmptying }
								totalItemsSpam={ emptySpam.totalItemsSpam }
								selectedResponsesCount={ emptySpam.selectedResponsesCount }
							/>,
					  ]
					: [] ),
				...( renameFormItem
					? [
							<FormNameModal
								key="rename-form-modal"
								isOpen={ !! renameFormItem }
								onClose={ closeRenameModal }
								onSave={ handleRename }
								title={ __( 'Rename form', 'jetpack-forms' ) }
								initialValue={ renameFormItem?.title || '' }
							/>,
					  ]
					: [] ),
				...( isPermanentDeleteConfirmOpen
					? [
							<ConfirmDialog
								key="permanent-delete-confirm"
								onCancel={ closePermanentDeleteConfirm }
								onConfirm={ confirmPermanentDelete }
								isOpen={ isPermanentDeleteConfirmOpen }
								confirmButtonText={ __( 'Delete permanently', 'jetpack-forms' ) }
							>
								<h3>{ __( 'Delete permanently', 'jetpack-forms' ) }</h3>
								<p>
									{ __(
										'This will permanently delete this form. This action cannot be undone.',
										'jetpack-forms'
									) }
								</p>
							</ConfirmDialog>,
					  ]
					: [] ),
			];
		}

		// Desktop: show individual buttons
		if ( isFormsScreen ) {
			return [
				...( isIntegrationsEnabled && showDashboardIntegrations
					? [ <ManageIntegrationsButton key="integrations" onClick={ onOpenIntegrations } /> ]
					: [] ),
				<CreateFormButton key="create" variant="primary" showIcon={ false } showNameModal />,
			];
		}

		if ( isSingleFormScreen ) {
			return [
				...( sourceIdNumber && formStatus !== 'trash'
					? [
							<EditFormButton
								key="edit-form"
								formId={ sourceIdNumber }
								onClick={ trackEditFormClick }
							/>,
					  ]
					: [] ),
				<ExportResponsesButton
					key="export"
					isPrimary={ statusView === 'inbox' }
					showIcon={ false }
					onClick={ trackExportClick }
				/>,
				...( statusView === 'trash' ? [ <EmptyTrashButton key="empty-trash" /> ] : [] ),
				...( statusView === 'spam' ? [ <EmptySpamButton key="empty-spam" /> ] : [] ),
				...( formItemControls.length > 0
					? [
							<DropdownMenu
								key="form-actions-menu"
								controls={ formItemControls }
								icon={ moreVertical }
								label={ __( 'More actions', 'jetpack-forms' ) }
								toggleProps={ { size: 'compact' } }
							/>,
					  ]
					: [] ),
				...( renameFormItem
					? [
							<FormNameModal
								key="rename-form-modal"
								isOpen={ !! renameFormItem }
								onClose={ closeRenameModal }
								onSave={ handleRename }
								title={ __( 'Rename form', 'jetpack-forms' ) }
								initialValue={ renameFormItem?.title || '' }
							/>,
					  ]
					: [] ),
				...( isPermanentDeleteConfirmOpen
					? [
							<ConfirmDialog
								key="permanent-delete-confirm"
								onCancel={ closePermanentDeleteConfirm }
								onConfirm={ confirmPermanentDelete }
								isOpen={ isPermanentDeleteConfirmOpen }
								confirmButtonText={ __( 'Delete permanently', 'jetpack-forms' ) }
							>
								<h3>{ __( 'Delete permanently', 'jetpack-forms' ) }</h3>
								<p>
									{ __(
										'This will permanently delete this form. This action cannot be undone.',
										'jetpack-forms'
									) }
								</p>
							</ConfirmDialog>,
					  ]
					: [] ),
			];
		}

		// Responses list screen.
		return [
			...( statusView === 'inbox' && isIntegrationsEnabled && showDashboardIntegrations
				? [ <ManageIntegrationsButton key="integrations" onClick={ onOpenIntegrations } /> ]
				: [] ),
			...( statusView === 'inbox'
				? [
						<CreateFormButton
							key="create"
							variant="secondary"
							showPatterns={ false }
							showIcon={ false }
							showNameModal
						/>,
				  ]
				: [] ),
			<ExportResponsesButton
				key="export"
				isPrimary={ statusView === 'inbox' }
				showIcon={ false }
				onClick={ trackExportClickResponsesList }
			/>,
			...( statusView === 'trash' ? [ <EmptyTrashButton key="empty-trash" /> ] : [] ),
			...( statusView === 'spam' ? [ <EmptySpamButton key="empty-spam" /> ] : [] ),
		];
	}, [
		adminUrl,
		isSm,
		isIntegrationsEnabled,
		onOpenIntegrations,
		showDashboardIntegrations,
		sourceIdNumber,
		isFormsScreen,
		isSingleFormScreen,
		formItemControls,
		statusView,
		handleCreateFormClick,
		isCreateFormModalOpen,
		closeCreateFormModal,
		handleCreateFormSave,
		openExportModal,
		showExportModal,
		closeExportModal,
		onExport,
		autoConnectGdrive,
		hasResponses,
		exportLabel,
		emptyTrash.openConfirmDialog,
		emptyTrash.isEmpty,
		emptyTrash.isEmptying,
		emptyTrash.isConfirmDialogOpen,
		emptyTrash.closeConfirmDialog,
		emptyTrash.onConfirmEmptying,
		emptyTrash.totalItemsTrash,
		emptyTrash.selectedResponsesCount,
		emptySpam.openConfirmDialog,
		emptySpam.isEmpty,
		emptySpam.isEmptying,
		emptySpam.isConfirmDialogOpen,
		emptySpam.closeConfirmDialog,
		emptySpam.onConfirmEmptying,
		emptySpam.totalItemsSpam,
		emptySpam.selectedResponsesCount,
		renameFormItem,
		closeRenameModal,
		handleRename,
		isPermanentDeleteConfirmOpen,
		closePermanentDeleteConfirm,
		confirmPermanentDelete,
		formStatus,
		trackAction,
		trackEditFormClick,
		trackExportClick,
		trackExportClickResponsesList,
	] );

	return { ariaLabel, breadcrumbs, title, badges, subtitle, actions };
}
