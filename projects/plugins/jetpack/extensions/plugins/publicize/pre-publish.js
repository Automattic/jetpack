import {
	PublicizePanel,
	SocialImageGeneratorPanel,
	useSyncPostDataToStore,
	useSocialMediaConnections,
	usePostCanUseSig,
} from '@automattic/jetpack-publicize-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import UpsellNotice from './components/upsell';

const PrePublishPanels = () => {
	useSyncPostDataToStore();

	const { hasEnabledConnections } = useSocialMediaConnections();
	const postCanUseSig = usePostCanUseSig();

	return (
		<>
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

			{ postCanUseSig && (
				<PluginPrePublishPanel
					initialOpen
					title={ __( 'Social Image Generator', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<SocialImageGeneratorPanel prePublish={ true } />
				</PluginPrePublishPanel>
			) }
		</>
	);
};

export default PrePublishPanels;
