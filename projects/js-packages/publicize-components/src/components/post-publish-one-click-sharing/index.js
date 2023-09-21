import { Text, ThemeProvider } from '@automattic/jetpack-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { ShareButtons } from '../share-buttons/share-buttons';
import styles from './styles.module.scss';

const PostPublishOneClickSharing = () => {
	return (
		<>
			<PluginPostPublishPanel
				initialOpen
				title={ __( 'One-Click sharing', 'jetpack' ) }
				id="publicize-manual-sharing"
				icon={ <JetpackEditorPanelLogo /> }
			>
				<ThemeProvider>
					<Text className={ styles.description } variant="body-small">
						{ __(
							"Share with a Single Click! ✨ Just tap the Twitter or WhatsApp icon, and we'll prep your content for sharing.",
							'jetpack'
						) }
					</Text>
					<ShareButtons />
				</ThemeProvider>
			</PluginPostPublishPanel>
		</>
	);
};

export default PostPublishOneClickSharing;
