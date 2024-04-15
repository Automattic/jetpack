import { SocialIcon } from '@automattic/jetpack-components';
import {
	SocialPreviewsModal,
	SocialPreviewsPanel,
	SocialImageGeneratorPanel,
	usePublicizeConfig,
	useSocialMediaConnections,
	PublicizePanel,
	PostPublishReviewPrompt,
	PostPublishManualSharing,
	useSyncPostDataToStore,
} from '@automattic/jetpack-publicize-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
} from '@wordpress/edit-post';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { getQueryArg } from '@wordpress/url';
import Description from './components/publicize-panel/description';

import './editor.scss';

/**
 * Open Jetpack Social sidebar by default when URL includes jetpackSidebarIsOpen=true.
 */
domReady( () => {
	if ( getQueryArg( window.location.search, 'jetpackSidebarIsOpen' ) === 'true' ) {
		dispatch( 'core/interface' ).enableComplementaryArea(
			'core/edit-post',
			'jetpack-social/jetpack-social'
		);
	}
} );

registerPlugin( 'jetpack-social', {
	render: () => <JetpackSocialSidebar />,
} );

const JetpackSocialSidebar = () => {
	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, hidePublicizeFeature, isSocialImageGeneratorAvailable } =
		usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	const PanelDescription = () => (
		<Description
			{ ...{
				isPostPublished,
				isPublicizeEnabled,
				hidePublicizeFeature,
				hasConnections,
				hasEnabledConnections,
			} }
		/>
	);
	useSyncPostDataToStore();

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			{ isModalOpened && <SocialPreviewsModal onClose={ closeModal } /> }

			<PluginSidebarMoreMenuItem target="jetpack-social" icon={ <SocialIcon /> }>
				Jetpack Social
			</PluginSidebarMoreMenuItem>

			<PluginSidebar name="jetpack-social" title="Jetpack Social" icon={ <SocialIcon /> }>
				<PublicizePanel>
					<PanelDescription />
				</PublicizePanel>
				{ isSocialImageGeneratorAvailable && <SocialImageGeneratorPanel /> }
				<PanelBody title={ __( 'Social Previews', 'jetpack-social' ) }>
					<SocialPreviewsPanel openModal={ openModal } />
				</PanelBody>
			</PluginSidebar>

			<PluginPrePublishPanel
				initialOpen
				title={ __( 'Share this post', 'jetpack-social' ) }
				icon={ <JetpackEditorPanelLogo /> }
			>
				<PublicizePanel prePublish={ true }>
					<PanelDescription />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ isSocialImageGeneratorAvailable && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack-social' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }

			<PluginPrePublishPanel
				initialOpen
				title={ __( 'Social Previews', 'jetpack-social' ) }
				icon={ <JetpackEditorPanelLogo /> }
			>
				<SocialPreviewsPanel openModal={ openModal } />
			</PluginPrePublishPanel>

			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</PostTypeSupportCheck>
	);
};
