import { Button, PanelBody, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { NewsletterEmailDocumentSettings } from '../../shared/memberships/settings';
import SubscribersAffirmation from '../../shared/memberships/subscribers-affirmation';
import { NewsletterTestEmailModal } from './email-preview';
import { SendIcon } from './icons';

const NewsletterMenu = ( { openPreviewModal } ) => {
	const [ isTestEmailModalOpen, setIsTestEmailModalOpen ] = useState( false );

	const { postId, postType, postStatus, meta } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
			postType: select( 'core/editor' ).getCurrentPostType(),
			postStatus: select( 'core/editor' ).getEditedPostAttribute( 'status' ),
			meta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		} ),
		[]
	);

	const accessLevel = useAccessLevel( postType );
	const isPublished = postStatus === 'publish';
	const isSendEmailEnabled = ! meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ];

	const openTestEmailModal = () => setIsTestEmailModalOpen( true );
	const closeTestEmailModal = () => setIsTestEmailModalOpen( false );

	return (
		<PluginSidebar
			name="jetpack-newsletter-settings-sidebar"
			title={ 'Jetpack Newsletter' }
			icon={ <SendIcon /> }
			className="jetpack-newsletter-settings-sidebar"
		>
			<PanelBody>
				{ ! isPublished && <NewsletterEmailDocumentSettings /> }
				<SubscribersAffirmation accessLevel={ accessLevel } prePublish={ ! isPublished } />
				{ isSendEmailEnabled && ! isPublished && (
					<>
						<p>
							{ __(
								'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
								'jetpack'
							) }
						</p>
						<HStack wrap={ true }>
							<Button
								onClick={ openPreviewModal }
								variant="secondary"
								disabled={ isPublished || ! postId }
							>
								{ __( 'Preview email', 'jetpack' ) }
							</Button>
							<Button
								onClick={ openTestEmailModal }
								variant="secondary"
								disabled={ isPublished || ! postId }
							>
								{ __( 'Send test email', 'jetpack' ) }
							</Button>
						</HStack>
						{ /*
						 * Previewing works over a site (blog-token) connection, so the button
						 * above is available to everyone. Sending a test email still requires a
						 * user connection; that gating lives inside the modal.
						 */ }
						<NewsletterTestEmailModal
							isOpen={ isTestEmailModalOpen }
							onClose={ closeTestEmailModal }
						/>
					</>
				) }
			</PanelBody>
		</PluginSidebar>
	);
};

export default NewsletterMenu;
