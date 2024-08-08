import { Button, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { PreviewModal } from './email-preview'; // Adjust the import path as needed
import { SendIcon } from './icons'; // Adjust the import path as needed

const NewsletterMenu = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { postId } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
		} ),
		[]
	);

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
					<p>
						{ __(
							'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
							'jetpack'
						) }
					</p>
					<Button
						onClick={ openModal }
						style={ {
							marginRight: '18px',
						} }
						variant="secondary"
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
