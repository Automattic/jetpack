import { useConnection } from '@automattic/jetpack-connection';
import { Button, PanelBody, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { useAccessLevel } from '../../shared/memberships/edit';
import SubscribersAffirmation from '../../shared/memberships/subscribers-affirmation';
import { PreviewModal, EmailPreview } from './email-preview';
import { SendIcon } from './icons';

const NewsletterMenu = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ isEmailPreviewOpen, setIsEmailPreviewOpen ] = useState( false );

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
	const openEmailPreview = () => setIsEmailPreviewOpen( true );
	const closeEmailPreview = () => setIsEmailPreviewOpen( false );

	return (
		<PluginSidebar
			name="newsletter-settings-sidebar"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <SendIcon /> }
		>
			<PanelBody>
				{ isUserConnected ? (
					<>
						<SubscribersAffirmation accessLevel={ accessLevel } prePublish={ ! isPublished } />
						{ ! isPublished && (
							<p>
								{ __(
									'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
									'jetpack'
								) }
							</p>
						) }
						<HStack wrap={ true }>
							<Button onClick={ openModal } variant="secondary" disabled={ isPublished }>
								{ __( 'Preview email', 'jetpack' ) }
							</Button>
							<Button onClick={ openEmailPreview } variant="secondary" disabled={ isPublished }>
								{ __( 'Send test email', 'jetpack' ) }
							</Button>
						</HStack>
						<PreviewModal isOpen={ isModalOpen } onClose={ closeModal } postId={ postId } />
						<EmailPreview isModalOpen={ isEmailPreviewOpen } closeModal={ closeEmailPreview } />
					</>
				) : (
					<>
						<p>
							{ __(
								'To email your posts, build an audience, and use features like preview and test, connect to WordPress.com cloud.',
								'jetpack'
							) }
						</p>
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
