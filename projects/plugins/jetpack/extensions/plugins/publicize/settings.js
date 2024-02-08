import {
	PostPublishManualSharing,
	PostPublishReviewPrompt,
	PublicizePanel,
	SocialImageGeneratorPanel,
	useSyncPostDataToStore,
	usePublicizeConfig,
	useSocialMediaConnections,
} from '@automattic/jetpack-publicize-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import UpsellNotice from './components/upsell';

export const Settings = () => {
	useSyncPostDataToStore();
	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isSocialImageGeneratorAvailable, isJetpackSocialNote } = usePublicizeConfig();

	const hasSocialImageGenerator = isSocialImageGeneratorAvailable && ! isJetpackSocialNote;

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<JetpackPluginSidebar>
				<PublicizePanel>
					<UpsellNotice />
				</PublicizePanel>
				{ hasSocialImageGenerator && <SocialImageGeneratorPanel /> }
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
				<PublicizePanel prePublish={ true }>
					<UpsellNotice />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ hasSocialImageGenerator && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }

			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</PostTypeSupportCheck>
	);
};
