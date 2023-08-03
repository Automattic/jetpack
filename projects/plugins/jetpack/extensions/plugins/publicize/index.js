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
	TwitterThreadListener,
	PublicizePanel,
	useSocialMediaConnections,
	usePublicizeConfig,
	SocialImageGeneratorPanel,
	PostPublishReviewPrompt,
} from '@automattic/jetpack-publicize-components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackEditorPanelLogo from '../../shared/jetpack-editor-panel-logo';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import UpsellNotice from './components/upsell';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isSocialImageGeneratorAvailable } = usePublicizeConfig();

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<TwitterThreadListener />

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

			<PostPublishReviewPrompt />
		</PostTypeSupportCheck>
	);
};

export const settings = {
	render: PublicizeSettings,
};
