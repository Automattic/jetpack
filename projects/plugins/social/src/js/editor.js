import { JetpackLogo, SocialIcon, getRedirectUrl } from '@automattic/jetpack-components';
import {
	SocialPreviewsModal,
	SocialPreviewsPanel,
	usePublicizeConfig,
	useSocialMediaConnections,
	PublicizePanel,
	ReviewPrompt,
} from '@automattic/jetpack-publicize-components';
import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { PanelBody } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
	PluginPostPublishPanel,
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
			'jetpack-social-sidebar/jetpack-social'
		);
	}
} );

registerPlugin( 'jetpack-social', {
	render: () => <JetpackSocialSidebar />,
} );

const JetpackSocialSidebar = () => {
	const [ isModalOpened, setIsModalOpened ] = useState( false );
	const isReviewRequestDismissed = getJetpackData()?.social?.reviewRequestDismissed ?? false;
	const reviewRequestDismissUpdatePath = getJetpackData()?.social?.dismissReviewRequestPath ?? null;
	const [ isReviewRequestVisible, setIsReviewRequestVisible ] = useState(
		! isReviewRequestDismissed
	);

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );
	const hideReviewRequest = useCallback( () => setIsReviewRequestVisible( false ), [
		setIsReviewRequestVisible,
	] );

	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, hidePublicizeFeature } = usePublicizeConfig();
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

	// Handle when the review request is dismissed
	const handleReviewDismiss = useCallback( () => {
		// Save that the user has dismissed this by calling to the social plugin API method
		apiFetch( {
			path: reviewRequestDismissUpdatePath,
			method: 'POST',
			data: { dismissed: true },
		} )
			.then( () => {
				// there's nothing to do here.
			} )
			.catch( () => {
				// there's nothing to do here.
			} );
		hideReviewRequest();
	}, [ hideReviewRequest, reviewRequestDismissUpdatePath ] );

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
				<PanelBody title={ __( 'Social Previews', 'jetpack-social' ) }>
					<SocialPreviewsPanel openModal={ openModal } />
				</PanelBody>
			</PluginSidebar>

			<PluginPrePublishPanel
				initialOpen
				title={ __( 'Share this post', 'jetpack-social' ) }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<PublicizePanel prePublish={ true }>
					<PanelDescription />
				</PublicizePanel>
			</PluginPrePublishPanel>

			<PluginPrePublishPanel
				initialOpen
				title={ __( 'Social Previews', 'jetpack-social' ) }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<SocialPreviewsPanel openModal={ openModal } />
			</PluginPrePublishPanel>

			{ isReviewRequestVisible && isPublicizeEnabled && hasEnabledConnections && (
				<PluginPostPublishPanel id="publicize-title">
					<ReviewPrompt
						href={ getRedirectUrl( 'jetpack-social-plugin-reviews' ) }
						onClose={ handleReviewDismiss }
					/>
				</PluginPostPublishPanel>
			) }
		</PostTypeSupportCheck>
	);
};
