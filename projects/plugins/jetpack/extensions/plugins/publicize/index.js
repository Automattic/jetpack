/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */

import { JetpackLogo } from '@automattic/jetpack-components';
import {
	TwitterThreadListener,
	PublicizePanel,
	useSocialMediaConnections,
	usePublicizeConfig,
	SocialImageGeneratorPanel,
} from '@automattic/jetpack-publicize-components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import UpsellNotice from './components/upsell';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { hasEnabledConnections } = useSocialMediaConnections();
	const { isSocialImageGeneratorEnabled } = usePublicizeConfig();

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<TwitterThreadListener />

			<JetpackPluginSidebar>
				<PublicizePanel enableTweetStorm={ true }>
					<UpsellNotice />
				</PublicizePanel>
				{ isSocialImageGeneratorEnabled && <SocialImageGeneratorPanel /> }
			</JetpackPluginSidebar>

			<PluginPrePublishPanel
				initialOpen={ hasEnabledConnections }
				id="publicize-title"
				title={
					<span id="publicize-defaults" key="publicize-title-span">
						{ __( 'Share this post', 'jetpack' ) }
					</span>
				}
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				<PublicizePanel prePublish={ true } enableTweetStorm={ true }>
					<UpsellNotice />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ isSocialImageGeneratorEnabled && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack' ) }
					icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }
		</PostTypeSupportCheck>
	);
};

export const settings = {
	render: PublicizeSettings,
};
