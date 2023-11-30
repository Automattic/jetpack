import { Text, ThemeProvider } from '@automattic/jetpack-components';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import OneClickSharingModal from '../one-click-sharing-modal';
import { ShareButtons } from '../share-buttons/share-buttons';
import styles from './styles.module.scss';

const PostPublishOneClickSharing = () => {
	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	const { isCurrentPostPublished } = useSelect( select => select( editorStore ), [] );

	if ( ! isCurrentPostPublished() ) {
		return null;
	}

	return (
		<PluginPostPublishPanel
			initialOpen
			title={ __( 'One-Click sharing', 'jetpack' ) }
			id="publicize-manual-sharing"
			icon={ <JetpackEditorPanelLogo /> }
		>
			<ThemeProvider>
				<Text className={ styles.description } variant="body-small">
					{ __(
						"Share with a Single Click!✨ Just tap the Social icons or the 'Copy to Clipboard' icon, and we'll format your content for sharing.",
						'jetpack'
					) }
					&nbsp;
					<Button variant="link" onClick={ openModal }>
						{ __( 'Learn more..', 'jetpack' ) }
					</Button>
				</Text>
				<ShareButtons />
			</ThemeProvider>
			{ isModalOpened && <OneClickSharingModal onClose={ closeModal } /> }
		</PluginPostPublishPanel>
	);
};

export default PostPublishOneClickSharing;
