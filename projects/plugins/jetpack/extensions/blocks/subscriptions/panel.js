import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isComingSoon,
	isPrivateSite,
	JetpackEditorPanelLogo,
	useAnalytics,
	useModuleStatus,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Flex, FlexItem, Notice, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginDocumentSettingPanel,
	PluginPostPublishPanel,
} from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useState, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel, isNewsletterFeatureEnabled } from '../../shared/memberships/edit';
import {
	Link,
	getReachForAccessLevelKey,
	NewsletterAccessDocumentSettings,
	NewsletterAccessPrePublishSettings,
} from '../../shared/memberships/settings';
import {
	getFormattedCategories,
	getFormattedSubscriptionsCount,
	getShowMisconfigurationWarning,
} from '../../shared/memberships/utils';
import { store as membershipProductsStore } from '../../store/membership-products';
import metadata from './block.json';
import EmailPreview from './email-preview';

import './panel.scss';

const name = metadata.name.replace( 'jetpack/', '' );

const SubscriptionsPanelPlaceholder = ( { children } ) => {
	return (
		<Flex align="center" gap={ 4 } direction="column" style={ { alignItems: 'center' } }>
			<FlexItem>
				{ __(
					'In order to send posts to your subscribers, activate the Subscriptions feature.',
					'jetpack'
				) }
			</FlexItem>
			<FlexItem>{ children }</FlexItem>
			<FlexItem>
				<ExternalLink href="https://jetpack.com/support/subscriptions/">
					{ __( 'Learn more about Subscriptions', 'jetpack' ) }
				</ExternalLink>
			</FlexItem>
		</Flex>
	);
};

function NewsletterEditorSettingsPanel( { accessLevel } ) {
	return (
		<PluginDocumentSettingPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Access', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterAccessDocumentSettings accessLevel={ accessLevel } />
		</PluginDocumentSettingPanel>
	);
}

const NewsletterDisabledNotice = () => (
	<Notice status="info" isDismissible={ false } className="edit-post-post-visibility__notice">
		{ __( 'You will be able to send newsletters once the site is published', 'jetpack' ) }
	</Notice>
);

const NewsletterDisabledPanels = () => (
	<>
		<PluginDocumentSettingPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginDocumentSettingPanel>
		<PluginPrePublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPrePublishPanel>
		<PluginPostPublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPostPublishPanel>
	</>
);

function NewsletterPrePublishSettingsPanel( {
	accessLevel,
	setPostMeta,
	isModuleActive,
	showPreviewModal,
} ) {
	const { tracks } = useAnalytics();
	const { changeStatus, isLoadingModules, isChangingStatus } = useModuleStatus( name );

	const enableSubscriptionsModule = () => {
		tracks.recordEvent( 'jetpack_editor_subscriptions_enable' );
		return changeStatus( true );
	};

	// Subscriptions will not be triggered for a post that was already published in the past.
	const shouldLoadSubscriptionPlaceholder = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
		return ! isModuleActive && ! isLoadingModules && ! meta?.jetpack_post_was_ever_published;
	} );

	return (
		<PluginPrePublishPanel
			initialOpen
			className="jetpack-subscribe-newsletters-panel"
			title={
				<>
					{ __( 'Newsletter:', 'jetpack' ) }
					{ accessLevel && (
						<span className={ 'jetpack-subscribe-post-publish-panel__heading' }>
							{ accessOptions[ accessLevel ].panelHeading }
						</span>
					) }
				</>
			}
			icon={ <JetpackEditorPanelLogo /> }
		>
			{ isModuleActive && (
				<>
					<NewsletterAccessPrePublishSettings
						accessLevel={ accessLevel }
						setPostMeta={ setPostMeta }
					/>
					<Button variant="secondary" onClick={ showPreviewModal }>
						{ __( 'Send test email', 'jetpack' ) }
					</Button>
				</>
			) }

			{ shouldLoadSubscriptionPlaceholder && (
				<SubscriptionsPanelPlaceholder>
					<Button
						variant="secondary"
						isBusy={ isChangingStatus }
						disabled={ isModuleActive || isChangingStatus }
						onClick={ enableSubscriptionsModule }
					>
						{ isChangingStatus
							? __( 'Activating Subscriptions', 'jetpack' )
							: __(
									'Activate Subscriptions',
									'jetpack',
									/* dummy arg to avoid bad minification */ 0
							  ) }
					</Button>
				</SubscriptionsPanelPlaceholder>
			) }
		</PluginPrePublishPanel>
	);
}

// Determines copy to show in post-publish panel to confirm number and type of subscribers who received the post as email, or will receive in case of scheduled post.
function getNumberOfSubscribersText( {
	accessLevel,
	isScheduledPost,
	newsletterCategories,
	newsletterCategoriesEnabled,
	postCategories,
	postName,
	reachCount,
	subscriptionsCount,
} ) {
	// Text when categories are enabled
	if (
		newsletterCategoriesEnabled &&
		newsletterCategories.length &&
		accessLevel !== accessOptions.paid_subscribers.key
	) {
		const formattedCategoryNames = getFormattedCategories( postCategories, newsletterCategories );
		const formattedSubscriptionsCount = getFormattedSubscriptionsCount( subscriptionsCount );
		const categoryNamesAndSubscriptionsCount = formattedCategoryNames + formattedSubscriptionsCount;

		if ( isScheduledPost && formattedCategoryNames ) {
			return sprintf(
				// translators: %1s is the post name, %2s is the list of categories with subscriptions count
				__(
					'<postPublishedLink>%1$s</postPublishedLink> was sent to everyone subscribed to %2$s.',
					'jetpack'
				),
				postName,
				categoryNamesAndSubscriptionsCount
			);
		} else if ( formattedCategoryNames ) {
			return sprintf(
				// translators: %1s is the post name, %2s is the list of categories with subscriptions count
				__(
					'<postPublishedLink>%1$s</postPublishedLink> will be sent to everyone subscribed to %2$s.',
					'jetpack'
				),
				postName,
				categoryNamesAndSubscriptionsCount
			);
		}
	}

	// Texts when no categories...
	const isPaidPost = accessLevel === accessOptions.paid_subscribers.key;

	// Paid subscribers, schedulled post
	if ( isScheduledPost && isPaidPost ) {
		return sprintf(
			/* translators: %1s is the post name, %2s is the number of subscribers in numerical format */
			__(
				'<postPublishedLink>%1$s</postPublishedLink> will be sent to <strong>%2$s paid subscribers</strong>.',
				'jetpack'
			),
			postName,
			reachCount
		);
	}
	// Paid subscribers, post is already published
	else if ( isPaidPost ) {
		return sprintf(
			/* translators: %1s is the post name, %2s is the number of subscribers in numerical format */
			__(
				'<postPublishedLink>%1$s</postPublishedLink> was sent to <strong>%2$s paid subscribers</strong>.',
				'jetpack'
			),
			postName,
			reachCount
		);
	}
	// Free subscribers, schedulled post
	else if ( isScheduledPost ) {
		return sprintf(
			/* translators: %1s is the post name, %2s is the number of subscribers in numerical format */
			__(
				'<postPublishedLink>%1$s</postPublishedLink> will be sent to <strong>%2$s subscribers</strong>.',
				'jetpack'
			),
			postName,
			reachCount
		);
	}

	// Free subscribers
	return sprintf(
		/* translators: %1s is the post name, %2s is the number of subscribers in numerical format */
		__(
			'<postPublishedLink>%1$s</postPublishedLink> was sent to <strong>%2$s subscribers</strong>.',
			'jetpack'
		),
		postName,
		reachCount
	);
}

function NewsletterPostPublishSettingsPanel( { accessLevel } ) {
	const isScheduledPost = useSelect( select => select( editorStore ).isCurrentPostScheduled(), [] );

	const { emailSubscribers, paidSubscribers } = useSelect( select =>
		select( membershipProductsStore ).getSubscriberCounts()
	);

	const { postName, postPublishedLink } = useSelect( select => {
		const currentPost = select( editorStore ).getCurrentPost();
		return {
			postName: currentPost.title,
			postPublishedLink: currentPost.link,
		};
	} );

	const { isStripeConnected } = useSelect( select => {
		const { getConnectUrl } = select( membershipProductsStore );
		return {
			isStripeConnected: null === getConnectUrl(),
		};
	} );

	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );

	const { newsletterCategories, newsletterCategoriesEnabled } = useSelect( select => {
		const { getNewsletterCategories, getNewsletterCategoriesEnabled } = select(
			'jetpack/membership-products'
		);

		return {
			newsletterCategories: getNewsletterCategories(),
			newsletterCategoriesEnabled: getNewsletterCategoriesEnabled(),
		};
	} );

	const postCategories = useSelect( select =>
		select( editorStore ).getEditedPostAttribute( 'categories' )
	);

	const subscriptionsCount = useSelect( select => {
		return select( 'jetpack/membership-products' ).getNewsletterCategoriesSubscriptionsCount(
			postCategories
		);
	} );

	const reachCount = getReachForAccessLevelKey(
		accessLevel,
		emailSubscribers,
		paidSubscribers
	).toLocaleString();

	const numberOfSubscribersText = getNumberOfSubscribersText( {
		accessLevel,
		isScheduledPost,
		newsletterCategories,
		newsletterCategoriesEnabled,
		postCategories,
		postName,
		reachCount,
		subscriptionsCount,
	} );
	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<>
			<PluginPostPublishPanel
				initialOpen
				title={
					<>
						{ __( 'Newsletter:', 'jetpack' ) }
						{ accessLevel && (
							<span className={ 'jetpack-subscribe-post-publish-panel__heading' }>
								{ accessOptions[ accessLevel ].panelHeading }
							</span>
						) }
					</>
				}
				className="jetpack-subscribe-newsletters-panel jetpack-subscribe-post-publish-panel"
				icon={ <JetpackEditorPanelLogo /> }
			>
				{ ! showMisconfigurationWarning && (
					<Notice className="jetpack-subscribe-post-publish-panel__notice" isDismissible={ false }>
						{ createInterpolateElement( numberOfSubscribersText, {
							strong: <strong />,
							postPublishedLink: <Link href={ postPublishedLink } />,
						} ) }
					</Notice>
				) }
			</PluginPostPublishPanel>

			{ ! isStripeConnected && (
				<PluginPostPublishPanel
					initialOpen
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

export default function SubscribePanels() {
	const { isModuleActive } = useModuleStatus( name );
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

	// Subscriptions will not be triggered on private sites ( on WordPress.com simple and WoA ),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return <NewsletterDisabledPanels />;
	}

	return (
		<>
			{ isModuleActive && <NewsletterEditorSettingsPanel accessLevel={ accessLevel } /> }
			<NewsletterPrePublishSettingsPanel
				accessLevel={ accessLevel }
				isModuleActive={ isModuleActive }
				showPreviewModal={ () => {
					tracks.recordEvent( 'jetpack_send_email_preview_prepublish_preview_button' );
					setIsModalOpen( true );
				} }
			/>
			{ isModuleActive && <NewsletterPostPublishSettingsPanel accessLevel={ accessLevel } /> }
			<EmailPreview isModalOpen={ isModalOpen } closeModal={ () => setIsModalOpen( false ) } />
		</>
	);
}
