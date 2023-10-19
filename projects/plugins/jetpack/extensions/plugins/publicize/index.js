/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */
import {
	PublicizePanel,
	useSocialMediaConnections,
	usePublicizeConfig,
	SocialImageGeneratorPanel,
	PostPublishReviewPrompt,
	PostPublishOneClickSharing,
} from '@automattic/jetpack-publicize-components';
import {
	JetpackEditorPanelLogo,
	useModuleStatus,
} from '@automattic/jetpack-shared-extension-utils';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import { PublicizePlaceholder } from './components/placeholder';
import PublicizeSkeletonLoader from './components/skeleton-loader';
import UpsellNotice from './components/upsell';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isSocialImageGeneratorAvailable } = usePublicizeConfig();
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( name );

	if ( isLoadingModules ) {
		return (
			<PostTypeSupportCheck supportKeys="publicize">
				<JetpackPluginSidebar>
					<PublicizeSkeletonLoader />
				</JetpackPluginSidebar>
			</PostTypeSupportCheck>
		);
	}

	if ( ! isModuleActive ) {
		return (
			<PostTypeSupportCheck supportKeys="publicize">
				<JetpackPluginSidebar>
					<PublicizePlaceholder
						changeStatus={ changeStatus }
						isModuleActive={ isModuleActive }
						isLoading={ isChangingStatus }
					/>
				</JetpackPluginSidebar>
			</PostTypeSupportCheck>
		);
	}

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<JetpackPluginSidebar>
				<PublicizePanel enableTweetStorm={ true }>
					<UpsellNotice />
				</PublicizePanel>
				{ isSocialImageGeneratorAvailable && <SocialImageGeneratorPanel /> }
			</JetpackPluginSidebar>

			<PluginPrePublishPanel
				initialOpen={ hasEnabledConnections }
				id="publicize-title"
				title={
					<span id="publicize-defaults" key="publicize-title-span">
						{ __( 'Share this post', 'jetpack' ) }
					</span>
				}
				icon={ <JetpackEditorPanelLogo /> }
			>
				<PublicizePanel prePublish={ true } enableTweetStorm={ true }>
					<UpsellNotice />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ isSocialImageGeneratorAvailable && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }

			<PostPublishOneClickSharing />
			<PostPublishReviewPrompt />
		</PostTypeSupportCheck>
	);
};

export const settings = {
	render: PublicizeSettings,
};
