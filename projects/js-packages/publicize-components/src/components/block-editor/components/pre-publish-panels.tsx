import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PluginPrePublishPanel as DeprecatedPluginPrePublishPanel } from '@wordpress/edit-post';
import { PluginPrePublishPanel as EditorPluginPrePublishPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { usePostCanUseSig } from '../../../hooks/use-post-can-use-sig';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { useSyncPostDataToStore } from '../../../hooks/use-sync-post-data-to-store';
import PublicizePanel from '../../panel';
import SocialImageGeneratorPanel from '../../social-image-generator/panel';
import { UpsellNotice } from './upsell';

const PluginPrePublishPanel = EditorPluginPrePublishPanel || DeprecatedPluginPrePublishPanel;

const PrePublishPanels = () => {
	useSyncPostDataToStore();

	const { hasEnabledConnections } = useSocialMediaConnections();
	const postCanUseSig = usePostCanUseSig();

	return (
		<>
			<PluginPrePublishPanel
				initialOpen={ hasEnabledConnections }
				title={ __( 'Share this post', 'jetpack-publicize-components' ) }
				icon={ <JetpackEditorPanelLogo /> }
			>
				<PublicizePanel prePublish={ true }>
					<UpsellNotice />
				</PublicizePanel>
			</PluginPrePublishPanel>

			{ postCanUseSig && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack-publicize-components' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }
		</>
	);
};

export default PrePublishPanels;
