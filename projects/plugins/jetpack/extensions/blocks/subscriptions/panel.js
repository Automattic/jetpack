import { JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';
import {
	isComingSoon,
	isPrivateSite,
	useModuleStatus,
	useAnalytics,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Flex, FlexItem, Notice, PanelRow } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginDocumentSettingPanel,
	PluginPostPublishPanel,
} from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { store as membershipProductsStore } from '../../store/membership-products';
import { getSubscriberCounts } from './api';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, accessOptions } from './constants';
import EmailPreview from './email-preview';
import {
	Link,
	getReachForAccessLevelKey,
	NewsletterAccessDocumentSettings,
	NewsletterAccessPrePublishSettings,
} from './settings';
import { isNewsletterFeatureEnabled } from './utils';
import { name } from './';

import './panel.scss';

const SubscriptionsPanelPlaceholder = ( { children } ) => {
	return (
		<Flex align="center" gap={ 4 } direction="column" style={ { alignItems: 'center' } }>
			<FlexItem>
				{ __(
					"In order to share your posts with your subscribers, you'll need to activate the Subscriptions feature.",
					'jetpack'
				) }
			</FlexItem>
			<FlexItem>{ children }</FlexItem>
			<FlexItem>
				<ExternalLink href="https://jetpack.com/support/subscriptions/">
					{ __( 'Learn more about the Subscriptions feature.', 'jetpack' ) }
				</ExternalLink>
			</FlexItem>
		</Flex>
	);
};

function NewsletterEditorSettingsPanel( {
	accessLevel,
	setPostMeta,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	isModuleActive,
	showMisconfigurationWarning,
} ) {
	if ( ! isModuleActive ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			<NewsletterAccessDocumentSettings
				accessLevel={ accessLevel }
				setPostMeta={ setPostMeta }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
				showMisconfigurationWarning={ showMisconfigurationWarning }
			/>
			<EmailPreview />
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
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			<NewsletterDisabledNotice />
		</PluginDocumentSettingPanel>
		<PluginPrePublishPanel
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			<NewsletterDisabledNotice />
		</PluginPrePublishPanel>
		<PluginPostPublishPanel
			title={ __( 'Newsletter visibility', 'jetpack' ) }
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			<NewsletterDisabledNotice />
		</PluginPostPublishPanel>
	</>
);

function NewsletterPrePublishSettingsPanel( {
	accessLevel,
	setPostMeta,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
	isModuleActive,
	showMisconfigurationWarning,
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
			className="jetpack-subscribe-pre-publish-panel"
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			{ isModuleActive && (
				<NewsletterAccessPrePublishSettings
					accessLevel={ accessLevel }
					setPostMeta={ setPostMeta }
					socialFollowers={ socialFollowers }
					emailSubscribers={ emailSubscribers }
					paidSubscribers={ paidSubscribers }
					showMisconfigurationWarning={ showMisconfigurationWarning }
				/>
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

function NewsletterPostPublishSettingsPanel( {
	accessLevel,
	emailSubscribers,
	paidSubscribers,
	isModuleActive,
	showMisconfigurationWarning,
} ) {
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

	if ( ! isModuleActive ) {
		return null;
	}

	const reachCount = getReachForAccessLevelKey( accessLevel, emailSubscribers, paidSubscribers );

	let subscriberType = __( 'subscribers', 'jetpack' );
	if ( accessLevel === accessOptions.paid_subscribers.key ) {
		subscriberType = __( 'paid subscribers', 'jetpack' );
	}

	const numberOfSubscribersText = sprintf(
		/* translators: %1s is the post name,  %2s is the number of subscribers in numerical format, %3s Options are paid subscribers or subscribers */
		__(
			'<postPublishedLink>%1$s</postPublishedLink> was sent to <strong>%2$s %3$s</strong>.',
			'jetpack'
		),
		postName,
		reachCount,
		subscriberType
	);

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
				className="jetpack-subscribe-post-publish-panel"
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
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
					className="paid-newsletters-post-publish-panel"
					title={ __( 'Set up a paid newsletter', 'jetpack' ) }
					icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
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
	const [ paidSubscribers, setPaidSubscribers ] = useState( null );
	const [ socialFollowers, setSocialFollowers ] = useState( null );
	const [ emailSubscribers, setEmailSubscribers ] = useState( null );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ postMeta = [], setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	// Set the accessLevel to "everybody" when one is not defined
	let accessLevel =
		postMeta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] ?? accessOptions.everybody.key;

	// If accessLevel is ''
	if ( ! accessLevel ) {
		accessLevel = accessOptions.everybody.key;
	}

	useEffect( () => {
		if ( ! isModuleActive ) {
			return;
		}
		getSubscriberCounts( counts => {
			setEmailSubscribers( counts.email_subscribers );
			setSocialFollowers( counts.social_followers );
			setPaidSubscribers( counts.paid_subscribers );
		} );
	}, [ isModuleActive ] );

	// Can be “private”, “password”, or “public”.
	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );

	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	const showMisconfigurationWarning =
		postVisibility !== 'public' && accessLevel !== accessOptions.everybody.key;

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
			<NewsletterEditorSettingsPanel
				accessLevel={ accessLevel }
				setPostMeta={ setPostMeta }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
				showMisconfigurationWarning={ showMisconfigurationWarning }
				isModuleActive={ isModuleActive }
			/>
			<NewsletterPrePublishSettingsPanel
				accessLevel={ accessLevel }
				setPostMeta={ setPostMeta }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
				isModuleActive={ isModuleActive }
				showMisconfigurationWarning={ showMisconfigurationWarning }
			/>
			<NewsletterPostPublishSettingsPanel
				accessLevel={ accessLevel }
				setPostMeta={ setPostMeta }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
				isModuleActive={ isModuleActive }
				showMisconfigurationWarning={ showMisconfigurationWarning }
			/>
		</>
	);
}
