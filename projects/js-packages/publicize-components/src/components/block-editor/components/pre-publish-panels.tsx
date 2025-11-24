import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PluginPrePublishPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { useSyncPostDataToStore } from '../../../hooks/use-sync-post-data-to-store';
import PublicizePanel from '../../panel';

const PrePublishPanels = () => {
	useSyncPostDataToStore();

	const { hasEnabledConnections } = useSocialMediaConnections();

	return (
		<>
			<PluginPrePublishPanel
				initialOpen={ hasEnabledConnections }
				title={ __( 'Share to Social Media', 'jetpack-publicize-components' ) }
				icon={ <JetpackEditorPanelLogo /> }
			>
				<PublicizePanel prePublish={ true } />
			</PluginPrePublishPanel>
		</>
	);
};

export default PrePublishPanels;
