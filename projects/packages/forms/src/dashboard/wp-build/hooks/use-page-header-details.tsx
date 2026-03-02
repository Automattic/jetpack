/**
 * External dependencies
 */
import { useBreakpointMatch } from '@automattic/jetpack-components';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { DropdownMenu, Button } from '@wordpress/components';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { Badge, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import CreateFormButton from '../../components/create-form-button';
import EditFormButton from '../../components/edit-form-button';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptySpamConfirmationModal from '../../components/empty-spam-button/confirmation-modal';
import EmptyTrashButton from '../../components/empty-trash-button';
import EmptyTrashConfirmationModal from '../../components/empty-trash-button/confirmation-modal';
import ExportResponsesButton from '../../components/export-responses/button';
import ExportResponsesModal from '../../components/export-responses/modal';
import useCreateForm from '../../hooks/use-create-form';
import useEmptySpam from '../../hooks/use-empty-spam';
import useEmptyTrash from '../../hooks/use-empty-trash';
import useExportResponses from '../../hooks/use-export-responses';
import useInboxData from '../../hooks/use-inbox-data';
import ManageIntegrationsButton from '../components/manage-integrations-button';
import useFormItemActions from './use-form-item-actions';
import type { ReactNode } from 'react';

type ResponsesStatusView = 'inbox' | 'spam' | 'trash';

type UsePageHeaderDetailsProps = {
	screen: 'forms' | 'responses';
	statusView?: ResponsesStatusView;
	sourceId?: string | number;
	formsCount?: number;
	isIntegrationsEnabled: boolean;
	showDashboardIntegrations: boolean;
	onOpenIntegrations: () => void;
	onOpenFormsHelp?: () => void;
};

type UsePageHeaderDetailsReturn = {
	breadcrumbs: ReactNode;
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
		formsCount,
		isIntegrationsEnabled,
		showDashboardIntegrations,
		onOpenIntegrations,
		onOpenFormsHelp,
	} = props;
	const statusView: ResponsesStatusView = props.statusView ?? 'inbox';
	const sourceIdNumber = useMemo( () => {
		const value = sourceId;
		const numberValue = typeof value === 'number' ? value : Number( value );
		return Number.isFinite( numberValue ) && numberValue > 0 ? numberValue : null;
	}, [ sourceId ] );

	// Detect mobile viewport
	const [ isSm ] = useBreakpointMatch( 'sm' );

	// Mutually-exclusive screen flags.
	const isFormsScreen = screen === 'forms';
	const isSingleFormScreen = screen === 'responses' && sourceIdNumber !== null;

	// Hooks for mobile dropdown menu actions
	const { openNewForm } = useCreateForm();
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

	const formRecord = useSelect(
		select =>
			sourceIdNumber
				? ( select( coreDataStore ).getEntityRecord(
						'postType',
						'jetpack_form',
						sourceIdNumber
				  ) as { title?: { rendered?: string }; status?: string } | undefined )
				: undefined,
		[ sourceIdNumber ]
	);

	const formTitle = useMemo( () => {
		const rendered = formRecord?.title?.rendered || '';
		return decodeEntities( rendered );
	}, [ formRecord?.title?.rendered ] );

	const formStatus = formRecord?.status;

	const statusLabel = useMemo( () => {
		switch ( formStatus ) {
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
				return formStatus;
		}
	}, [ formStatus ] );

	const badges = useMemo( () => {
		if ( ! isSingleFormScreen || ! formStatus || formStatus === 'publish' ) {
			return undefined;
		}
		return <Badge intent="draft">{ statusLabel }</Badge>;
	}, [ isSingleFormScreen, formStatus, statusLabel ] );

	const { duplicateForm, previewForm, copyEmbed, copyShortcode } = useFormItemActions();

	const formItemControls = useMemo( () => {
		if ( ! sourceIdNumber ) {
			return [];
		}

		const formItem = { id: sourceIdNumber, title: formTitle };
		const controls: Array< { title: string; onClick: () => void } > = [
			{
				title: __( 'Duplicate', 'jetpack-forms' ),
				onClick: () => duplicateForm( formItem ),
			},
			{
				title: __( 'Preview', 'jetpack-forms' ),
				onClick: () => previewForm( formItem ),
			},
		];

		if ( navigator?.clipboard ) {
			controls.push(
				{
					title: __( 'Copy embed', 'jetpack-forms' ),
					onClick: () => copyEmbed( formItem ),
				},
				{
					title: __( 'Copy shortcode', 'jetpack-forms' ),
					onClick: () => copyShortcode( formItem ),
				}
			);
		}

		return controls;
	}, [ sourceIdNumber, formTitle, duplicateForm, previewForm, copyEmbed, copyShortcode ] );

	const breadcrumbsItems = useMemo( () => {
		if ( isSingleFormScreen ) {
			return [
				{ label: __( 'Forms', 'jetpack-forms' ), to: '/forms' },
				{ label: formTitle || __( 'Form responses', 'jetpack-forms' ) },
			];
		}

		return [ { label: __( 'Forms', 'jetpack-forms' ) } ];
	}, [ formTitle, isSingleFormScreen ] );

	const breadcrumbs = useMemo( () => {
		return (
			<Stack align="center" gap="xs">
				<JetpackLogo showText={ false } width={ 20 } />
				<Breadcrumbs items={ breadcrumbsItems } />
			</Stack>
		);
	}, [ breadcrumbsItems ] );

	const subtitle = useMemo( () => {
		if ( isFormsScreen ) {
			const shortMessage = __( 'View and manage all your forms.', 'jetpack-forms' );
			const longMessage = __( 'View and manage all your forms in one place.', 'jetpack-forms' );

			const shouldShowFormsHelpLink =
				!! onOpenFormsHelp && ( typeof formsCount !== 'number' || formsCount < 5 );

			return shouldShowFormsHelpLink ? (
				<>
					{ shortMessage }{ ' ' }
					<Button variant="link" onClick={ onOpenFormsHelp }>
						{ __( 'Missing forms?', 'jetpack-forms' ) }
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
	}, [ formTitle, isFormsScreen, isSingleFormScreen, onOpenFormsHelp, formsCount ] );

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
					onClick: () => openNewForm( {} ),
					title: __( 'Create a form', 'jetpack-forms' ),
				} );
			} else if ( isSingleFormScreen ) {
				// Single form screen: Edit form (not in trash/spam), Export, Empty trash/spam
				if ( statusView === 'inbox' && sourceIdNumber ) {
					dropdownControls.push( {
						onClick: () => {
							const fallbackEditUrl = `post.php?post=${ sourceIdNumber }&action=edit&post_type=jetpack_form`;
							const url = new URL( fallbackEditUrl, window.location.origin );
							window.location.href = url.toString();
						},
						title: __( 'Edit form', 'jetpack-forms' ),
					} );
				}
				dropdownControls.push( {
					onClick: openExportModal,
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
						onClick: () => openNewForm( { showPatterns: false } ),
						title: __( 'Create a form', 'jetpack-forms' ),
					} );
				}

				dropdownControls.push( {
					onClick: openExportModal,
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
			];
		}

		// Desktop: show individual buttons
		if ( isFormsScreen ) {
			return [
				...( isIntegrationsEnabled && showDashboardIntegrations
					? [ <ManageIntegrationsButton key="integrations" onClick={ onOpenIntegrations } /> ]
					: [] ),
				<CreateFormButton key="create" variant="primary" showIcon={ false } />,
			];
		}

		if ( isSingleFormScreen ) {
			return [
				...( sourceIdNumber
					? [ <EditFormButton key="edit-form" formId={ sourceIdNumber } /> ]
					: [] ),
				<ExportResponsesButton
					key="export"
					isPrimary={ statusView === 'inbox' }
					showIcon={ false }
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
						/>,
				  ]
				: [] ),
			<ExportResponsesButton
				key="export"
				isPrimary={ statusView === 'inbox' }
				showIcon={ false }
			/>,
			...( statusView === 'trash' ? [ <EmptyTrashButton key="empty-trash" /> ] : [] ),
			...( statusView === 'spam' ? [ <EmptySpamButton key="empty-spam" /> ] : [] ),
		];
	}, [
		isSm,
		isIntegrationsEnabled,
		onOpenIntegrations,
		showDashboardIntegrations,
		sourceIdNumber,
		isFormsScreen,
		isSingleFormScreen,
		formItemControls,
		statusView,
		openNewForm,
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
	] );

	return { breadcrumbs, badges, subtitle, actions };
}
