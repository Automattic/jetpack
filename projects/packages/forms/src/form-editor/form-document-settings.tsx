/**
 * Form Document Settings Panel
 * Displays form settings in the Document Settings sidebar when editing a jetpack_form post
 */

import { hasFeatureFlag, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { URLInput, store as blockEditorStore } from '@wordpress/block-editor';
import {
	TextareaControl,
	TextControl,
	ToggleControl,
	RadioControl,
	Button,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { Suspense, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ActiveIntegrations from '../blocks/contact-form/components/jetpack-integrations-modal/active-integrations/index.js';
import IntegrationsModal from '../blocks/contact-form/components/jetpack-integrations-modal/index.tsx';
import NotificationsSettings from '../blocks/contact-form/components/notifications-settings.js';
import WebhooksSettings from '../blocks/contact-form/components/webhooks-settings.js';
import JetpackManageResponsesSettings from '../blocks/shared/components/jetpack-manage-responses-settings.js';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import useConfigValue from '../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../store/integrations/index.ts';

/**
 * Wrapper component for integrations that extracts just the content for Document Settings
 *
 * @param {object}   root0               - Component props
 * @param {object}   root0.attributes    - Block attributes
 * @param {Function} root0.setAttributes - Function to update block attributes
 * @return {JSX.Element} Integrations content component
 */
function IntegrationsContent( {
	attributes,
	setAttributes,
}: {
	attributes: Record< string, unknown >;
	setAttributes: ( attrs: Record< string, unknown > ) => void;
} ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const integrations = useSelect( select => {
		const store = select( INTEGRATIONS_STORE );
		return store.getIntegrations() || [];
	}, [] );
	const isLoading = useSelect( select => select( INTEGRATIONS_STORE ).isIntegrationsLoading(), [] );
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const { tracks } = useAnalytics();
	const showIntegrationIcons = useConfigValue( 'showIntegrationIcons' );

	const handleOpenModal = useCallback( () => {
		tracks.recordEvent( 'jetpack_forms_block_modal_view', { entry_point: 'document-settings' } );
		setIsModalOpen( true );
	}, [ tracks ] );

	const handleCloseModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	return (
		<>
			{ showIntegrationIcons !== false && (
				<ActiveIntegrations
					integrations={ integrations }
					attributes={ attributes }
					isLoading={ isLoading }
				/>
			) }
			<Button variant="secondary" onClick={ handleOpenModal } __next40pxDefaultSize={ true }>
				{ __( 'Manage integrations', 'jetpack-forms' ) }
			</Button>
			<IntegrationsModal
				isOpen={ isModalOpen }
				onClose={ handleCloseModal }
				attributes={ attributes }
				setAttributes={ setAttributes }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
			/>
		</>
	);
}

/**
 * Get the contact form block client ID from the editor
 *
 * @return {string|null} The client ID of the contact form block, or null if not found
 */
function useContactFormClientId() {
	return useSelect( select => {
		const { getBlocks } = select( blockEditorStore );
		const blocks = getBlocks();

		// Find the contact form block (should be the root block in a jetpack_form post)
		const findContactFormId = ( blockList: unknown[] ): string | null => {
			for ( const block of blockList ) {
				if ( block?.name === 'jetpack/contact-form' ) {
					return block.clientId;
				}
				if ( block?.innerBlocks?.length > 0 ) {
					const found = findContactFormId( block.innerBlocks );
					if ( found ) {
						return found;
					}
				}
			}
			return null;
		};

		return findContactFormId( blocks );
	}, [] );
}

/**
 * Get the contact form block attributes
 *
 * @param {string|null} clientId - The client ID of the contact form block
 * @return {Record<string, unknown>|null} The block attributes, or null if not found
 */
function useContactFormAttributes( clientId: string | null ) {
	return useSelect(
		select => {
			if ( ! clientId ) {
				return null;
			}
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientId );
		},
		[ clientId ]
	);
}

/**
 * Form Document Settings component
 * Renders form configuration panels in the Document Settings sidebar
 *
 * @return {JSX.Element|null} The form document settings component, or null if not in jetpack_form editor
 */
export function FormDocumentSettings() {
	const instanceId = useInstanceId( FormDocumentSettings );
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showWebhooks = useConfigValue( 'isWebhooksEnabled' ) && hasFeatureFlag( 'form-webhooks' );
	const showBlockIntegrations = useConfigValue( 'showBlockIntegrations' );

	// Check if we're editing a jetpack_form post
	const { isJetpackFormEditor, postAuthorEmail } = useSelect( select => {
		const { getCurrentPostType, getEditedPostAttribute } = select( editorStore );
		const { getUser } = select( 'core' );
		const postType = getCurrentPostType();
		const authorId = getEditedPostAttribute( 'author' );
		const authorEmail = authorId && getUser( authorId )?.email;

		return {
			isJetpackFormEditor: postType === FORM_POST_TYPE,
			postAuthorEmail: authorEmail,
		};
	}, [] );

	// Get the contact form block client ID (stable across re-renders)
	const clientId = useContactFormClientId();

	// Get the block attributes (updates when attributes change)
	const attributes = useContactFormAttributes( clientId );

	// Use dispatch to update block attributes
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Create a setAttributes function that uses the dispatch method
	const setAttributes = useCallback(
		( newAttributes: Record< string, unknown > ) => {
			if ( clientId ) {
				updateBlockAttributes( clientId, newAttributes );
			}
		},
		[ clientId, updateBlockAttributes ]
	);

	// Handler for confirmation type change
	const handleConfirmationTypeChange = useCallback(
		( newValue: 'text' | 'redirect' ) => {
			setAttributes( { confirmationType: newValue } );
		},
		[ setAttributes ]
	);

	// Handler for heading change
	const handleHeadingChange = useCallback(
		( newHeading: string ) => {
			setAttributes( { customThankyouHeading: newHeading } );
		},
		[ setAttributes ]
	);

	// Handler for message change
	const handleMessageChange = useCallback(
		( newMessage: string ) => {
			setAttributes( { customThankyouMessage: newMessage } );
		},
		[ setAttributes ]
	);

	// Handler for disable summary change
	const handleDisableSummaryChange = useCallback(
		( newDisableSummary: boolean ) => {
			setAttributes( { disableSummary: ! newDisableSummary } );
		},
		[ setAttributes ]
	);

	// Handler for disable go back change
	const handleDisableGoBackChange = useCallback(
		( newDisableGoBack: boolean ) => {
			setAttributes( { disableGoBack: ! newDisableGoBack } );
		},
		[ setAttributes ]
	);

	// Handler for redirect URL change
	const handleRedirectUrlChange = useCallback(
		( newURL: string ) => {
			setAttributes( { customThankyouRedirect: newURL } );
		},
		[ setAttributes ]
	);

	// Only show in jetpack_form editor
	if ( ! isJetpackFormEditor || ! clientId || ! attributes ) {
		return null;
	}
	const {
		to,
		subject,
		confirmationType,
		customThankyouHeading,
		customThankyouMessage,
		customThankyouRedirect,
		disableGoBack,
		disableSummary,
		emailNotifications,
		notificationRecipients,
		webhooks,
	} = attributes;

	return (
		<>
			<PluginDocumentSettingPanel
				name="form-action-after-submit"
				title={ __( 'Action after submit', 'jetpack-forms' ) }
				className="jetpack-contact-form__panel"
			>
				<RadioControl
					label={ __( 'Confirmation type', 'jetpack-forms' ) }
					selected={ confirmationType }
					options={ [
						{ label: __( 'Text', 'jetpack-forms' ), value: 'text' },
						{ label: __( 'Redirect link', 'jetpack-forms' ), value: 'redirect' },
					] }
					onChange={ handleConfirmationTypeChange }
				/>

				{ confirmationType === 'text' && (
					<>
						<TextControl
							label={ __( 'Message heading', 'jetpack-forms' ) }
							value={ customThankyouHeading }
							placeholder={ __( 'Your message has been sent', 'jetpack-forms' ) }
							onChange={ handleHeadingChange }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>

						<TextareaControl
							label={ __( 'Message text', 'jetpack-forms' ) }
							value={ customThankyouMessage }
							placeholder={ __( 'Thank you for your submission!', 'jetpack-forms' ) }
							onChange={ handleMessageChange }
							__nextHasNoMarginBottom={ true }
						/>

						<ToggleControl
							label={ __( 'Show summary', 'jetpack-forms' ) }
							checked={ ! disableSummary }
							onChange={ handleDisableSummaryChange }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>

						<ToggleControl
							label={ __( 'Show "Go back" link', 'jetpack-forms' ) }
							checked={ ! disableGoBack }
							onChange={ handleDisableGoBackChange }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</>
				) }

				{ confirmationType === 'redirect' && (
					<div>
						<URLInput
							label={ __( 'Redirect address', 'jetpack-forms' ) }
							value={ customThankyouRedirect }
							className="jetpack-contact-form__thankyou-redirect-url"
							onChange={ handleRedirectUrlChange }
						/>
					</div>
				) }
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel
				name="form-notifications"
				title={ __( 'Form notifications', 'jetpack-forms' ) }
				className="jetpack-contact-form__panel"
			>
				<NotificationsSettings
					notificationRecipients={ notificationRecipients }
					emailAddress={ to }
					emailSubject={ subject }
					emailNotifications={ emailNotifications }
					instanceId={ instanceId }
					postAuthorEmail={ postAuthorEmail }
					setAttributes={ setAttributes }
				/>
			</PluginDocumentSettingPanel>

			{ isIntegrationsEnabled && showBlockIntegrations && (
				<PluginDocumentSettingPanel
					name="form-integrations"
					title={ __( 'Integrations', 'jetpack-forms' ) }
					className="jetpack-contact-form__panel"
				>
					<Suspense fallback={ <div /> }>
						<IntegrationsContent attributes={ attributes } setAttributes={ setAttributes } />
					</Suspense>
				</PluginDocumentSettingPanel>
			) }

			{ showWebhooks && (
				<PluginDocumentSettingPanel
					name="form-webhooks"
					title={ __( 'Webhooks', 'jetpack-forms' ) }
					className="jetpack-contact-form__panel"
				>
					<WebhooksSettings webhooks={ webhooks } setAttributes={ setAttributes } />
				</PluginDocumentSettingPanel>
			) }

			<PluginDocumentSettingPanel
				name="form-responses-storage"
				title={ __( 'Responses storage', 'jetpack-forms' ) }
				className="jetpack-contact-form__panel jetpack-contact-form__responses-storage-panel"
			>
				<JetpackManageResponsesSettings attributes={ attributes } setAttributes={ setAttributes } />
			</PluginDocumentSettingPanel>
		</>
	);
}
