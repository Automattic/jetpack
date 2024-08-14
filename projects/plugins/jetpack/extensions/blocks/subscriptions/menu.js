import { Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { useAccessLevel } from '../../shared/memberships/edit';
import SubscribersAffirmation from '../../shared/memberships/subscribers-affirmation';
import { PreviewModal } from './email-preview';
import { SendIcon } from './icons';

const NewsletterMenu = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { postId, postType, postStatus } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
			postType: select( 'core/editor' ).getCurrentPostType(),
			postStatus: select( 'core/editor' ).getEditedPostAttribute( 'status' ),
		} ),
		[]
	);

	const accessLevel = useAccessLevel( postType );
	const isPublished = postStatus === 'publish';

	const { isUserConnected } = useConnection();
	const connectUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/connection`;

	const openModal = () => setIsModalOpen( true );
	const closeModal = () => setIsModalOpen( false );

	return (
		<PluginSidebar
			name="newsletter-settings-sidebar"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <SendIcon /> }
		>
			<PanelBody>
				{ isUserConnected ? (
					<>
						<SubscribersAffirmation accessLevel={ accessLevel } />
						{ ! isPublished && (
							<Text>
								{ __(
									'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
									'jetpack'
								) }
							</Text>
						) }
						<Button
							onClick={ openModal }
							style={ {
								marginRight: '18px',
								marginTop: '10px',
							} }
							variant="secondary"
							disabled={ isPublished }
						>
							{ __( 'Preview email', 'jetpack' ) }
						</Button>
						<PreviewModal isOpen={ isModalOpen } onClose={ closeModal } postId={ postId } />
					</>
				) : (
					<>
						<Text variant="title-small" mb={ 2 }>
							{ __( 'Newsletter', 'jetpack' ) }
						</Text>
						<Text mb={ 3 }>
							{ __(
								'To email your posts, build an audience, and use features like preview and test, connect to WordPress.com cloud.',
								'jetpack'
							) }
						</Text>
						<Button variant="primary" href={ connectUrl } style={ { marginTop: '10px' } }>
							{ __( 'Connect WordPress.com account', 'jetpack' ) }
						</Button>
					</>
				) }
			</PanelBody>
		</PluginSidebar>
	);
};

export default NewsletterMenu;
