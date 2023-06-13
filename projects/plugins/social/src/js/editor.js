import { JetpackLogo, SocialIcon, getRedirectUrl } from '@automattic/jetpack-components';
import {
	SocialPreviewsModal,
	SocialPreviewsPanel,
	SocialImageGeneratorPanel,
	usePublicizeConfig,
	useSocialMediaConnections,
	PublicizePanel,
	ReviewPrompt,
	usePostStartedPublishing,
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
	const [ isReviewRequestDismissed, setIsReviewRequestDismissed ] = useState(
		getJetpackData()?.social?.reviewRequestDismissed ?? true
	);
	const [ shouldReviewRequestShow, setShouldReviewRequestShow ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const {
		isPublicizeEnabled,
		hidePublicizeFeature,
		isPostAlreadyShared,
		isSocialImageGeneratorAvailable,
	} = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );
	// Determine if the review request should show right before the post publishes
	// The publicize-enabled meta and related connections are disabled after publishing
	usePostStartedPublishing( () => {
		setShouldReviewRequestShow(
			! isPostAlreadyShared && isPublicizeEnabled && hasEnabledConnections
		);
	}, [ isPostAlreadyShared, hasEnabledConnections, isPublicizeEnabled ] );

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
		const reviewRequestDismissUpdatePath =
			getJetpackData()?.social?.dismissReviewRequestPath ?? null;
		// Save that the user has dismissed this by calling to the social plugin API method
		apiFetch( {
			path: reviewRequestDismissUpdatePath,
			method: 'POST',
			data: { dismissed: true },
		} ).catch( error => {
			throw error;
		} );

		setIsReviewRequestDismissed( true );
	}, [] );

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
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<PublicizePanel prePublish={ true }>
					<PanelDescription />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ isSocialImageGeneratorAvailable && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack-social' ) }
					icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }

			<PluginPrePublishPanel
				initialOpen
				title={ __( 'Social Previews', 'jetpack-social' ) }
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<SocialPreviewsPanel openModal={ openModal } />
			</PluginPrePublishPanel>

			{ ! isReviewRequestDismissed && shouldReviewRequestShow && (
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
