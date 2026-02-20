/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPrePublishPanel, store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { page as pageIcon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import ConsentToggle from '../../blocks/contact-form/components/jetpack-integrations-modal/components/consent-toggle.tsx';
import IntegrationsModal from '../../blocks/contact-form/components/jetpack-integrations-modal/index.tsx';
import { FORM_POST_TYPE, FORM_BLOCK_NAME } from '../../blocks/shared/util/constants.js';
import AkismetIcon from '../../icons/akismet';
import GoogleSheetsIcon from '../../icons/google-sheets';
import HostingerReachIcon from '../../icons/hostinger-reach';
import MailPoetIcon from '../../icons/mailpoet';
import SalesforceIcon from '../../icons/salesforce';
import { INTEGRATIONS_STORE } from '../../store/integrations/index.ts';
import './form-pre-publish-panel.scss';

/**
 * A single settings summary row displayed in the pre-publish panel.
 * Uses the same structure as WordPress's PostPanelRow component
 * (HStack with editor-post-panel__row classes) for pixel-perfect matching.
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.onClick
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
				<Button variant="tertiary" onClick={ onClick } disabled={ ! onClick }>
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
 */
const useFormAttributes = () => {
	return useSelect( select => {
		const { getBlocks } = select( blockEditorStore ) as {
			getBlocks: () => Array< {
				name: string;
				clientId: string;
				attributes: Record< string, unknown >;
			} >;
		};

		const blocks = getBlocks();
		const formBlock = blocks.find( block => block.name === FORM_BLOCK_NAME );

		return {
			formBlock,
			attributes: ( formBlock?.attributes || {} ) as Record< string, unknown >,
			clientId: formBlock?.clientId || '',
		};
	}, [] );
};

/**
 * Hook to update contact-form block attributes from outside the block.
 */

/**
 * Form Pre-Publish Panel component.
 *
 * Displays a summary of form settings in the WordPress pre-publish sidebar,
 * allowing users to review and adjust settings before publishing.
 */
const FormPrePublishPanel = () => {
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

	const { attributes, clientId } = useFormAttributes();
	const { autosave } = useDispatch( 'core/editor' );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { closePublishSidebar } = useDispatch( editorStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Integrations store data for the modal
	const integrationsData = useSelect( select => {
		const store = select( INTEGRATIONS_STORE ) as {
			getIntegrations: () => Array< Record< string, unknown > >;
		};
		return store.getIntegrations() || [];
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

	// Determine active integrations and collect their icons
	const integrationIcons: JSX.Element[] = [];

	// Akismet is always active by default
	integrationIcons.push( <AkismetIcon key="akismet" width={ 20 } height={ 20 } /> );

	if ( attributes.jetpackCRM ) {
		// Use the Jetpack green icon for CRM
		integrationIcons.push(
			<svg
				key="jetpack-crm"
				width="20"
				height="20"
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M16 0C7.2 0 0 7.2 0 16s7.2 16 16 16 16-7.2 16-16S24.8 0 16 0zm-2.4 24.8L7.2 14.4l2.4-1.6 4 5.6 8.8-12 2.4 1.6-11.2 16.8z"
					fill="#069e08"
				/>
			</svg>
		);
	}

	const salesforceData = attributes.salesforceData as { organizationId?: string } | undefined;
	if ( salesforceData?.organizationId ) {
		integrationIcons.push( <SalesforceIcon key="salesforce" width={ 20 } height={ 20 } /> );
	}

	const mailpoet = attributes.mailpoet as { listId?: string | null } | undefined;
	if ( mailpoet?.listId ) {
		integrationIcons.push( <MailPoetIcon key="mailpoet" width={ 20 } height={ 20 } /> );
	}

	const hostingerReach = attributes.hostingerReach as { groupName?: string } | undefined;
	if ( hostingerReach?.groupName ) {
		integrationIcons.push( <HostingerReachIcon key="hostinger" width={ 20 } height={ 20 } /> );
	}

	// Google Sheets integration
	if ( attributes.googleSheets ) {
		integrationIcons.push( <GoogleSheetsIcon key="google-sheets" width={ 20 } height={ 20 } /> );
	}

	const integrationsValue = (
		<span className="jetpack-form-pre-publish__integration-icons">{ integrationIcons }</span>
	);

	// Format confirmation type for display
	const confirmationLabel =
		confirmationType === 'redirect'
			? __( 'Redirect', 'jetpack-forms' )
			: __( 'Text', 'jetpack-forms' );

	// Format email recipients — show the address or count
	let emailsLabel: string;
	if ( ! emailNotifications ) {
		emailsLabel = __( 'Disabled', 'jetpack-forms' );
	} else if ( emailTo ) {
		const recipients = emailTo
			.split( ',' )
			.map( e => e.trim() )
			.filter( Boolean );
		if ( recipients.length === 1 ) {
			emailsLabel = __( '1 recipient', 'jetpack-forms' );
		} else {
			emailsLabel = recipients.length + ' ' + __( 'recipients', 'jetpack-forms' );
		}
	} else {
		emailsLabel = __( 'Enabled', 'jetpack-forms' );
	}

	// Format push notification recipients — show count
	let notificationsLabel: string;
	if ( ! hasNotifications ) {
		notificationsLabel = __( 'Disabled', 'jetpack-forms' );
	} else if ( notificationRecipients.length === 1 ) {
		notificationsLabel = __( '1 recipient', 'jetpack-forms' );
	} else {
		notificationsLabel = notificationRecipients.length + ' ' + __( 'recipients', 'jetpack-forms' );
	}

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
	 * Navigate to a specific settings panel in the block inspector.
	 *
	 * Flow:
	 * 1. Close the publish sidebar
	 * 2. Open the block inspector sidebar via wp.data store
	 * 3. Select the form block
	 * 4. Wait for the sidebar to render, then click the Block tab
	 * 5. Wait for the inspector panels to render, then open the target panel
	 */
	const openInspectorPanel = useCallback(
		( panelTitle: string ) => {
			// Step 1: Close the pre-publish sidebar
			closePublishSidebar();

			// Step 2: Select the form block
			selectBlock( clientId );

			// Step 3: Use the older openGeneralSidebar API to explicitly request
			// the block inspector sidebar, then use a retry loop for the DOM tab
			// click and panel expansion.
			const wpData = (
				window as unknown as {
					wp: {
						data: {
							dispatch: ( store: string ) => Record< string, ( ...args: unknown[] ) => unknown >;
						};
					};
				}
			 ).wp?.data;

			// Use openGeneralSidebar from edit-post store — this is the most
			// reliable way to switch to the block inspector tab.
			if ( wpData ) {
				try {
					wpData.dispatch( 'core/edit-post' ).openGeneralSidebar( 'edit-post/block' );
				} catch {
					// Fallback: try the interface store
					try {
						wpData
							.dispatch( 'core/interface' )
							.enableComplementaryArea( 'core', 'edit-post/block' );
					} catch {
						// silent
					}
				}
			}

			const tryOpen = ( attempt: number ) => {
				if ( attempt > 20 ) {
					return;
				}
				setTimeout( () => {
					// 3a: Find and click the top-level "Block" tab.
					// The form editor sidebar has "Form" and "Block" top-level tabs.
					const sidebar =
						document.querySelector( '.interface-complementary-area' ) ||
						document.querySelector( '.edit-post-sidebar' );
					if ( ! sidebar ) {
						tryOpen( attempt + 1 );
						return;
					}

					const topTabs = sidebar.querySelectorAll(
						':scope > [role="tablist"] > [role="tab"], :scope [role="tablist"] [role="tab"]'
					);
					let blockTabActive = false;
					for ( const tab of topTabs ) {
						if ( tab.textContent?.trim() === 'Block' ) {
							if ( ( tab as HTMLElement ).getAttribute( 'aria-selected' ) !== 'true' ) {
								( tab as HTMLElement ).click();
								tryOpen( attempt + 1 );
								return;
							}
							blockTabActive = true;
							break;
						}
					}

					if ( ! blockTabActive ) {
						tryOpen( attempt + 1 );
						return;
					}

					// 3b: Inside the block inspector, click the "Settings" sub-tab
					// (the gear icon — the second of the three icon tabs:
					// list view, settings, appearance/styles).
					const inspector = sidebar.querySelector( '.block-editor-block-inspector' );
					if ( ! inspector ) {
						tryOpen( attempt + 1 );
						return;
					}

					const subTabs = inspector.querySelectorAll( '[role="tab"]' );
					let settingsTabActive = false;
					for ( const tab of subTabs ) {
						const label = (
							tab.getAttribute( 'aria-label' ) ||
							tab.textContent ||
							''
						).toLowerCase();
						if ( label.includes( 'settings' ) || label.includes( 'setting' ) ) {
							if ( ( tab as HTMLElement ).getAttribute( 'aria-selected' ) !== 'true' ) {
								( tab as HTMLElement ).click();
								tryOpen( attempt + 1 );
								return;
							}
							settingsTabActive = true;
							break;
						}
					}

					// Fallback: if we can't find a tab by label, try the second tab
					// in the inspector sub-tab list (settings is typically the second).
					if ( ! settingsTabActive && subTabs.length >= 2 ) {
						const secondTab = subTabs[ 1 ] as HTMLElement;
						if ( secondTab.getAttribute( 'aria-selected' ) !== 'true' ) {
							secondTab.click();
							tryOpen( attempt + 1 );
							return;
						}
						settingsTabActive = true;
					}

					if ( ! settingsTabActive ) {
						tryOpen( attempt + 1 );
						return;
					}

					// 3c: Settings sub-tab is active — find and open the target panel
					const panels = document.querySelectorAll( '.components-panel__body-toggle' );
					let found = false;
					for ( const toggle of panels ) {
						if ( toggle.textContent?.includes( panelTitle ) ) {
							if ( toggle.getAttribute( 'aria-expanded' ) === 'false' ) {
								( toggle as HTMLElement ).click();
							}
							( toggle as HTMLElement ).scrollIntoView( { behavior: 'smooth', block: 'start' } );
							found = true;
							break;
						}
					}

					if ( ! found ) {
						tryOpen( attempt + 1 );
					}
				}, 150 );
			};
			tryOpen( 0 );
		},
		[ closePublishSidebar, selectBlock, clientId ]
	);

	return (
		<PluginPrePublishPanel className="jetpack-form-pre-publish-panel" initialOpen>
			{ /* Form identity card */ }
			<div className="jetpack-form-pre-publish__form-card">
				<span className="jetpack-form-pre-publish__form-icon">{ pageIcon }</span>
				<span className="jetpack-form-pre-publish__form-title">
					{ postTitle || __( 'Untitled Form', 'jetpack-forms' ) }
				</span>
			</div>

			{ /* Preview button */ }
			<Button
				variant="secondary"
				className="jetpack-form-pre-publish__preview-button"
				onClick={ handlePreview }
				isBusy={ isPreviewLoading }
			>
				{ isPreviewLoading
					? __( 'Saving & opening', 'jetpack-forms' )
					: __( 'Preview the form', 'jetpack-forms' ) }
			</Button>

			{ /* Settings summary rows */ }
			<div className="jetpack-form-pre-publish__settings">
				<SettingRow
					label={ __( 'Confirmation', 'jetpack-forms' ) }
					value={ confirmationLabel }
					onClick={ () => openInspectorPanel( __( 'Action after submit', 'jetpack-forms' ) ) }
				/>
				<SettingRow
					label={ __( 'Email notifications', 'jetpack-forms' ) }
					value={ emailsLabel }
					onClick={ () => openInspectorPanel( __( 'Form notifications', 'jetpack-forms' ) ) }
				/>
				<SettingRow
					label={ __( 'Push notifications', 'jetpack-forms' ) }
					value={ notificationsLabel }
					onClick={ () => openInspectorPanel( __( 'Form notifications', 'jetpack-forms' ) ) }
				/>
				<SettingRow
					label={ __( 'Integrations', 'jetpack-forms' ) }
					value={ integrationsValue }
					onClick={ () => setIsIntegrationsModalOpen( true ) }
				/>
				<SettingRow
					label={ __( 'Save responses', 'jetpack-forms' ) }
					value={ saveResponses ? __( 'Yes', 'jetpack-forms' ) : __( 'No', 'jetpack-forms' ) }
					onClick={ () => openInspectorPanel( __( 'Responses storage', 'jetpack-forms' ) ) }
				/>
			</div>

			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ () => setIsIntegrationsModalOpen( false ) }
				attributes={ attributes }
				setAttributes={ setFormAttributes }
				integrationsData={ integrationsData as Array< Record< string, unknown > > }
				refreshIntegrations={ refreshIntegrations }
				components={ modalComponents }
			/>
		</PluginPrePublishPanel>
	);
};

// Register the pre-publish panel plugin
registerPlugin( 'jetpack-form-pre-publish', {
	render: FormPrePublishPanel,
} );
