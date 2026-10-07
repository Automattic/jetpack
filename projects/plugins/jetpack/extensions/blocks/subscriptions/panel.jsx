import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isComingSoon,
	isPrivateSite,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { Button, Notice, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginPostPublishPanel,
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../shared/memberships/constants';
import { useAccessLevel, isNewsletterFeatureEnabled } from '../../shared/memberships/edit';
import { store as membershipProductsStore } from '../../store/membership-products';
import { NewsletterTestEmailModal } from './email-preview';
import NewsletterOverview, { NewsletterOverviewTitle } from './newsletter-overview';

import './panel.scss';

/**
 * Tracks status transitions and save completions, dispatching Redux flags so
 * SubscribersAffirmation can show the republish/modify blurb even when the
 * post-publish panel remounts. Stays mounted for the editor session.
 *
 * @return {null} Renders nothing.
 */
function NewsletterRepublishTracker() {
	const prevStatusRef = useRef( null );
	const {
		setPublishedWithEmailEnabledInSession: dispatchPublishedWithEmail,
		setAlreadySentPostModifiedInSession: dispatchModifiedAlreadySent,
	} = useDispatch( membershipProductsStore );

	const { postId, postMeta, postEmailSentState, status, isSavingPost } = useSelect( select => {
		const { getCurrentPost, getEditedPostAttribute } = select( editorStore );
		const { getPostEmailSentState } = select( membershipProductsStore );
		const post = getCurrentPost();
		const id = post?.id;
		if ( id ) {
			getPostEmailSentState( id );
		}
		return {
			postId: id,
			postMeta: getEditedPostAttribute( 'meta' ),
			postEmailSentState: id ? getPostEmailSentState( id ) : null,
			status: post?.status,
			isSavingPost: select( editorStore ).isSavingPost(),
		};
	}, [] );

	useLayoutEffect( () => {
		if ( postId ) {
			if ( status === 'publish' ) {
				const didTransition = prevStatusRef.current !== null && prevStatusRef.current !== 'publish';
				if ( didTransition ) {
					if ( ! postMeta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ] ) {
						dispatchPublishedWithEmail( postId );
					}
				}
			}
			if ( isSavingPost && postEmailSentState?.email_sent_at != null ) {
				dispatchModifiedAlreadySent( postId );
			}
		}
		prevStatusRef.current = status;
	}, [
		status,
		postId,
		isSavingPost,
		postEmailSentState?.email_sent_at,
		postMeta,
		dispatchPublishedWithEmail,
		dispatchModifiedAlreadySent,
	] );

	return null;
}

// Subscriptions will not be triggered on private sites ( on WordPress.com simple and WoA ),
// nor on sites that have not been launched yet.
const getNewsletterDisabledMessage = () => {
	if ( isComingSoon() ) {
		return __( 'You will be able to send newsletters once the site is published', 'jetpack' );
	}
	if ( isPrivateSite() ) {
		return __( 'Emails will not be sent to subscribers while your site is private', 'jetpack' );
	}
	return null;
};

const NewsletterDisabledNotice = () => {
	const message = getNewsletterDisabledMessage();
	if ( ! message ) {
		return null;
	}

	return (
		<Notice status="warning" isDismissible={ false } className="edit-post-post-visibility__notice">
			{ message }
		</Notice>
	);
};

const NewsletterDisabledPanels = () => (
	<>
		<PluginDocumentSettingPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Audience', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginDocumentSettingPanel>
		<PluginPrePublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPrePublishPanel>
		<PluginPostPublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPostPublishPanel>
	</>
);

function NewsletterPrePublishSettingsPanel( props ) {
	return (
		<PluginPrePublishPanel
			initialOpen
			name="jetpack-subscribe-newsletters-panel"
			className="jetpack-subscribe-newsletters-panel"
			title={ <NewsletterOverviewTitle accessLevel={ props.accessLevel } /> }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterOverview { ...props } prePublish />
		</PluginPrePublishPanel>
	);
}

function NewsletterPostPublishSettingsPanel( props ) {
	const { isStripeConnected } = useSelect( select => {
		const { getConnectUrl } = select( membershipProductsStore );
		return {
			isStripeConnected: null === getConnectUrl(),
		};
	} );

	return (
		<>
			<PluginPostPublishPanel
				initialOpen
				title={ <NewsletterOverviewTitle accessLevel={ props.accessLevel } /> }
				className="jetpack-subscribe-newsletters-panel jetpack-subscribe-post-publish-panel"
				icon={ <JetpackEditorPanelLogo /> }
				name="jetpack-subscribe-newsletters-postpublish-panel"
			>
				<NewsletterOverview { ...props } />
			</PluginPostPublishPanel>

			{ ! isStripeConnected && (
				<PluginPostPublishPanel
					className="jetpack-subscribe-newsletters-panel paid-newsletters-post-publish-panel"
					title={ __( 'Set up a paid newsletter', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<PanelRow>
						<p>
							{ __(
								'Allow your subscribers to support your work. Connect a Stripe account to get started.',
								'jetpack'
							) }
						</p>
					</PanelRow>
					<div role="link" className="post-publish-panel__postpublish-buttons">
						<Button
							target="_blank"
							variant="secondary"
							href={ getRedirectUrl( 'wpcom-earn', {
								site: getSiteFragment(),
							} ) }
						>
							{ __( 'Turn on paid newsletters', 'jetpack' ) }
							<Icon
								icon={ external }
								className="paid-newsletters-post-publish-panel__external_icon"
							/>
						</Button>
					</div>
				</PluginPostPublishPanel>
			) }
		</>
	);
}

export default function SubscribePanels( { openPreviewModal } ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { tracks } = useAnalytics();
	const accessLevel = useAccessLevel( postType );

	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	// Only show the panels when the corresponding filter is enabled
	if ( ! isNewsletterFeatureEnabled() ) {
		return null;
	}

	if ( getNewsletterDisabledMessage() ) {
		return <NewsletterDisabledPanels />;
	}

	// Each panel records its own event, so sidebar clicks aren't counted as pre-publish ones.
	const overviewProps = {
		accessLevel,
		openPreviewModal,
		openTestEmailModal: () => {
			tracks.recordEvent( 'jetpack_newsletter_test_email_opened', { source: 'newsletter_panel' } );
			setIsModalOpen( true );
		},
	};
	const openPrePublishTestEmailModal = () => {
		tracks.recordEvent( 'jetpack_send_email_preview_prepublish_preview_button' );
		setIsModalOpen( true );
	};

	return (
		<>
			<NewsletterRepublishTracker />
			<NewsletterPrePublishSettingsPanel
				{ ...overviewProps }
				openTestEmailModal={ openPrePublishTestEmailModal }
			/>
			<NewsletterPostPublishSettingsPanel { ...overviewProps } />
			<NewsletterTestEmailModal isOpen={ isModalOpen } onClose={ () => setIsModalOpen( false ) } />
		</>
	);
}

export { NewsletterRepublishTracker, getNewsletterDisabledMessage };
