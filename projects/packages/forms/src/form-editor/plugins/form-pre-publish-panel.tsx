/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPrePublishPanel, store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, _nx, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import ConsentToggle from '../../blocks/contact-form/components/jetpack-integrations-modal/components/consent-toggle.tsx';
import IntegrationsModal from '../../blocks/contact-form/components/jetpack-integrations-modal/index.tsx';
import { settings as formBlockSettings } from '../../blocks/contact-form/index.js';
import { FORM_POST_TYPE, FORM_BLOCK_NAME } from '../../blocks/shared/util/constants.js';
import { INTEGRATIONS_STORE } from '../../store/integrations/index.ts';
import { PANEL_STATE_STORE } from '../store/panel-state.ts';
import IntegrationIcons from './integration-icons.tsx';
import type { Integration } from '../../types/index.ts';
import type { Block } from '@wordpress/blocks';
import './form-pre-publish-panel.scss';

export const JETPACK_FORM_PRE_PUBLISH_PANEL = 'jetpack-form-pre-publish';

/**
 * A single settings summary row displayed in the pre-publish panel.
 * Uses the same structure as WordPress's PostPanelRow component
 * (HStack with editor-post-panel__row classes) for pixel-perfect matching.
 *
 * @param {object}             props         - Component props.
 * @param {string}             props.label   - The row label.
 * @param {string|JSX.Element} props.value   - The row value.
 * @param {Function}           props.onClick - Click handler for the value button.
 * @return {JSX.Element} The setting row element.
 */
const SettingRow = ( {
	label,
	value,
	onClick,
}: {
	label: string;
	value: string | JSX.Element;
	onClick?: () => void;
} ) => {
	return (
		<HStack className="editor-post-panel__row">
			<div className="editor-post-panel__row-label">{ label }</div>
			<div className="editor-post-panel__row-control">
				<Button variant="tertiary" size="compact" onClick={ onClick }>
					{ value }
				</Button>
			</div>
		</HStack>
	);
};

/**
 * Get the contact-form block attributes from the editor.
 * Since the form editor always has exactly one contact-form block,
 * we find it and return its attributes.
 *
 * @return {object} The form block attributes, clientId, and whether it has fields.
 */
const useFormAttributes = () => {
	return useSelect( select => {
		const { getBlocks } = select( blockEditorStore ) as {
			getBlocks: () => Block[];
		};

		const blocks = getBlocks();
		const formBlock = blocks.find( block => block.name === FORM_BLOCK_NAME );
		const hasFields = formBlock?.innerBlocks?.length;

		return {
			attributes: ( formBlock?.attributes || {} ) as Record< string, unknown >,
			clientId: formBlock?.clientId || '',
			hasFields,
		};
	}, [] );
};

/**
 * Form Pre-Publish Panel component.
 *
 * Displays a summary of form settings in the WordPress pre-publish sidebar,
 * allowing users to review and adjust settings before publishing.
 *
 * @return {JSX.Element|null} The pre-publish panel or null.
 */
export const FormPrePublishPanel = () => {
	const [ isPreviewLoading, setIsPreviewLoading ] = useState( false );
	const [ isIntegrationsModalOpen, setIsIntegrationsModalOpen ] = useState( false );

	const { postType, postTitle, postId, isDirty, isAutosaveable } = useSelect( select => {
		const editor = select( editorStore ) as {
			getCurrentPostType: () => string;
			getEditedPostAttribute: ( attr: string ) => unknown;
			getCurrentPostId: () => number;
			isEditedPostDirty: () => boolean;
			isEditedPostAutosaveable: () => boolean;
		};

		return {
			postType: editor.getCurrentPostType(),
			postTitle: editor.getEditedPostAttribute( 'title' ) as string,
			postId: editor.getCurrentPostId(),
			isDirty: editor.isEditedPostDirty(),
			isAutosaveable: editor.isEditedPostAutosaveable(),
		};
	} );

	const { attributes, clientId, hasFields } = useFormAttributes();
	const { autosave } = useDispatch( 'core/editor' );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { closePublishSidebar } = useDispatch( editorStore );
	const { selectBlock, updateBlockAttributes } = useDispatch( blockEditorStore );
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const { openPanel } = useDispatch( PANEL_STATE_STORE );

	// Integrations store data for the modal
	const integrationsData = useSelect( select => {
		const integrationsStore = select( INTEGRATIONS_STORE ) as {
			getIntegrations: () => Integration[] | null;
		};
		return integrationsStore.getIntegrations() || [];
	}, [] );
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const modalComponents = useMemo( () => ( { ConsentToggle } ), [] );

	// setAttributes wrapper for the integrations modal
	const setFormAttributes = useCallback(
		( newAttributes: Record< string, unknown > ) => {
			if ( clientId ) {
				updateBlockAttributes( clientId, newAttributes );
			}
		},
		[ clientId, updateBlockAttributes ]
	);

	// Preview handler (reuses the same logic as preview-button.tsx)
	const handlePreview = useCallback( async () => {
		if ( isPreviewLoading ) {
			return;
		}

		setIsPreviewLoading( true );
		try {
			if ( isDirty && isAutosaveable ) {
				await autosave();
			}

			const response = await apiFetch< { preview_url: string } >( {
				path: `/wp/v2/jetpack-forms/${ postId }/preview-url`,
			} );
			window.open( response.preview_url, '_blank' );
		} catch {
			createErrorNotice(
				__( 'Failed to generate preview URL. Please try again.', 'jetpack-forms' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsPreviewLoading( false );
		}
	}, [ postId, isPreviewLoading, isDirty, isAutosaveable, autosave, createErrorNotice ] );

	/**
	 * Open the block inspector sidebar and expand a specific panel.
	 * Uses the panel-state store to communicate with the block's edit component.
	 *
	 * @param {string} panelName - The panel to open.
	 */
	const openInspectorPanel = useCallback(
		( panelName: 'action-after-submit' | 'form-notifications' | 'responses-storage' ) => {
			closePublishSidebar();
			selectBlock( clientId );
			enableComplementaryArea( 'core/edit-post', 'edit-post/block' );
			openPanel( panelName );
		},
		[ closePublishSidebar, selectBlock, clientId, enableComplementaryArea, openPanel ]
	);

	// Click handlers for settings rows
	const handleConfirmationClick = useCallback(
		() => openInspectorPanel( 'action-after-submit' ),
		[ openInspectorPanel ]
	);
	const handleNotificationsClick = useCallback(
		() => openInspectorPanel( 'form-notifications' ),
		[ openInspectorPanel ]
	);
	const handleResponsesClick = useCallback(
		() => openInspectorPanel( 'responses-storage' ),
		[ openInspectorPanel ]
	);
	const handleIntegrationsClick = useCallback( () => setIsIntegrationsModalOpen( true ), [] );
	const handleIntegrationsModalClose = useCallback( () => setIsIntegrationsModalOpen( false ), [] );

	// Only render for jetpack_form post type
	if ( postType !== FORM_POST_TYPE ) {
		return null;
	}

	// Extract form settings from block attributes
	const confirmationType = ( attributes.confirmationType as string ) || 'text';
	const emailNotifications = attributes.emailNotifications !== false;
	const emailTo = ( attributes.to as string ) || '';
	const notificationRecipients = ( attributes.notificationRecipients as string[] ) || [];
	const hasNotifications = notificationRecipients.length > 0;
	const saveResponses = attributes.saveResponses !== false;

	// Format confirmation type for display
	const confirmationLabel =
		confirmationType === 'redirect'
			? __( 'Redirect', 'jetpack-forms' )
			: _x( 'Text', 'confirmation type', 'jetpack-forms' );

	// Format email recipients — show count
	let emailsLabel: string;
	if ( ! emailNotifications ) {
		emailsLabel = __( 'Disabled', 'jetpack-forms' );
	} else if ( emailTo ) {
		const recipients = emailTo
			.split( ',' )
			.map( e => e.trim() )
			.filter( Boolean );
		emailsLabel = sprintf(
			/* translators: %d: number of email recipients */
			_n( '%d recipient', '%d recipients', recipients.length, 'jetpack-forms' ),
			recipients.length
		);
	} else {
		emailsLabel = __( 'Enabled', 'jetpack-forms' );
	}

	// Format push notification recipients — show count
	let notificationsLabel: string;
	if ( ! hasNotifications ) {
		notificationsLabel = __( 'Disabled', 'jetpack-forms' );
	} else {
		notificationsLabel = sprintf(
			/* translators: %d: number of push notification recipients */
			_nx(
				'%d recipient',
				'%d recipients',
				notificationRecipients.length,
				'push notifications',
				'jetpack-forms'
			),
			notificationRecipients.length
		);
	}

	// Show warning if form has no fields
	if ( ! hasFields ) {
		return (
			<PluginPrePublishPanel className="jetpack-form-pre-publish-panel" initialOpen>
				<Notice status="error" isDismissible={ false }>
					{ __(
						'This form has no fields. Add at least one field before publishing.',
						'jetpack-forms'
					) }
				</Notice>
			</PluginPrePublishPanel>
		);
	}

	return (
		<PluginPrePublishPanel className="jetpack-form-pre-publish-panel" initialOpen>
			<div className="jetpack-form-pre-publish__form-card">
				<span className="jetpack-form-pre-publish__form-icon">
					{ formBlockSettings.icon.src() }
				</span>
				<span className="jetpack-form-pre-publish__form-title">
					{ postTitle || __( 'Untitled Form', 'jetpack-forms' ) }
				</span>
			</div>
			<Button
				variant="secondary"
				className="jetpack-form-pre-publish__preview-button"
				onClick={ handlePreview }
				isBusy={ isPreviewLoading }
			>
				{ isPreviewLoading
					? __( 'Saving & opening', 'jetpack-forms' )
					: _x( 'Preview the form', 'button label', 'jetpack-forms' ) }
			</Button>
			<div className="jetpack-form-pre-publish__settings">
				<SettingRow
					label={ __( 'Confirmation', 'jetpack-forms' ) }
					value={ confirmationLabel }
					onClick={ handleConfirmationClick }
				/>
				<SettingRow
					label={ __( 'Email notifications', 'jetpack-forms' ) }
					value={ emailsLabel }
					onClick={ handleNotificationsClick }
				/>
				<SettingRow
					label={ __( 'Push notifications', 'jetpack-forms' ) }
					value={ notificationsLabel }
					onClick={ handleNotificationsClick }
				/>
				<SettingRow
					label={ __( 'Integrations', 'jetpack-forms' ) }
					value={ <IntegrationIcons attributes={ attributes } integrations={ integrationsData } /> }
					onClick={ handleIntegrationsClick }
				/>
				<SettingRow
					label={ __( 'Save responses', 'jetpack-forms' ) }
					value={
						saveResponses
							? __( 'Yes', 'jetpack-forms' )
							: _x( 'No', 'save responses', 'jetpack-forms' )
					}
					onClick={ handleResponsesClick }
				/>
			</div>
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ handleIntegrationsModalClose }
				attributes={ attributes }
				setAttributes={ setFormAttributes }
				integrationsData={ integrationsData }
				refreshIntegrations={ refreshIntegrations }
				components={ modalComponents }
			/>
		</PluginPrePublishPanel>
	);
};
