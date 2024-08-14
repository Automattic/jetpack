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

	const openModal = () => setIsModalOpen( true );
	const closeModal = () => setIsModalOpen( false );

	return (
		<>
			<PluginSidebar
				name="newsletter-settings-sidebar"
				title={ __( 'Newsletter', 'jetpack' ) }
				icon={ <SendIcon /> }
			>
				<PanelBody>
					<SubscribersAffirmation accessLevel={ accessLevel } prePublish={ ! isPublished } />
					{ ! isPublished && (
						<p>
							{ __(
								'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
								'jetpack'
							) }
						</p>
					) }
					<Button
						onClick={ openModal }
						style={ {
							marginRight: '18px',
						} }
						variant="secondary"
						disabled={ isPublished }
					>
						{ __( 'Preview email', 'jetpack' ) }
					</Button>
				</PanelBody>
			</PluginSidebar>
			<PreviewModal isOpen={ isModalOpen } onClose={ closeModal } postId={ postId } />
		</>
	);
};

export default NewsletterMenu;
