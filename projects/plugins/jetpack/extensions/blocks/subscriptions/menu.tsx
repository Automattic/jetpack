import { Button, PanelBody, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { PluginSidebar, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useState } from 'react';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../shared/memberships/constants';
import { useAccessLevel } from '../../shared/memberships/edit';
import { NewsletterEmailDocumentSettings } from '../../shared/memberships/settings';
import SubscribersAffirmation from '../../shared/memberships/subscribers-affirmation';
import { NewsletterTestEmailModal } from './email-preview';
import { SendIcon } from './icons';

interface NewsletterMenuProps {
	openPreviewModal: () => void;
}

const NewsletterMenu = ( { openPreviewModal }: NewsletterMenuProps ) => {
	const [ isTestEmailModalOpen, setIsTestEmailModalOpen ] = useState( false );

	const { postId, postType, postStatus, meta } = useSelect( select => {
		const { getCurrentPostId, getCurrentPostType, getEditedPostAttribute } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
			postStatus: getEditedPostAttribute( 'status' ),
			meta: getEditedPostAttribute( 'meta' ),
		};
	}, [] );

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
			<PanelBody title={ __( 'Email', 'jetpack' ) } initialOpen>
				{ isPublished ? (
					<SubscribersAffirmation accessLevel={ accessLevel } />
				) : (
					<NewsletterEmailDocumentSettings />
				) }
				{ ! isSendEmailEnabled && ! isPublished && (
					<Notice.Root intent="warning" icon={ null }>
						<Notice.Title>{ __( 'Newsletter emails are turned off', 'jetpack' ) }</Notice.Title>
						<Notice.Description>
							{ __(
								'Newsletter categories only apply when this post is emailed. You can still choose who can read it below.',
								'jetpack'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				{ isSendEmailEnabled && ! isPublished && (
					<>
						<p>{ __( 'Preview or test your email before publishing.', 'jetpack' ) }</p>
						<VStack spacing={ 3 } className="jetpack-newsletter-settings-sidebar__email-buttons">
							<Button
								onClick={ openPreviewModal }
								variant="secondary"
								disabled={ ! postId }
								__next40pxDefaultSize
							>
								{ __( 'Preview email', 'jetpack' ) }
							</Button>
							<Button
								onClick={ openTestEmailModal }
								variant="secondary"
								disabled={ ! postId }
								__next40pxDefaultSize
							>
								{ __( 'Send test email', 'jetpack' ) }
							</Button>
						</VStack>
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
