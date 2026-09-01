import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PluginPrePublishPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { useSyncPostDataToStore } from '../../hooks/use-sync-post-data-to-store';
import PublicizePanel from '../panel';
import { PrePublishPreview } from '../pre-publish-preview';

const PrePublishPanels = () => {
	useSyncPostDataToStore();

	const { hasEnabledConnections } = useSocialMediaConnections();

	return (
		<PluginPrePublishPanel
			initialOpen={ hasEnabledConnections }
			title={ __( 'Share to social media', 'jetpack-publicize-pkg' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<PublicizePanel prePublish={ true } />
			<PrePublishPreview />
		</PluginPrePublishPanel>
	);
};

export default PrePublishPanels;
