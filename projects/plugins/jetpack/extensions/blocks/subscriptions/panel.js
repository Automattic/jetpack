import { JetpackLogo, numberFormat } from '@automattic/jetpack-components';
import {
	isComingSoon,
	isPrivateSite,
	useModuleStatus,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Flex, FlexItem } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginPostPublishPanel,
	PluginDocumentSettingPanel,
} from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import InspectorNotice from '../../shared/components/inspector-notice';
import './panel.scss';
import { getSubscriberCounts } from './api';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';
import { NewsletterAccess, accessOptions, MisconfigurationWarning } from './settings';
import { isNewsletterConfigured } from './utils';
import { name } from './';

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

function AccessLevelSelectorPanel( {
	setPostMeta,
	accessLevel,
	socialFollowers,
	emailSubscribers,
	paidSubscribers,
} ) {
	if ( ! isNewsletterConfigured() ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel title={ __( 'Newsletter', 'jetpack' ) }>
			<NewsletterAccess
				setPostMeta={ setPostMeta }
				accessLevel={ accessLevel }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
			/>
		</PluginDocumentSettingPanel>
	);
}

export default function SubscribePanels() {
	const [ emailSubscribers, setEmailSubscribers ] = useState( null );
	const [ paidSubscribers, setPaidSubscribers ] = useState( null );
	const [ socialFollowers, setSocialFollowers ] = useState( null );
	const { tracks } = useAnalytics();
	const { isModuleActive, changeStatus, isLoadingModules, isChangingStatus } =
		useModuleStatus( name );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ postMeta = [], setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	const accessLevel =
		postMeta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] ?? Object.keys( accessOptions )[ 0 ];

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
	const postVisibility = useSelect( select => select( 'core/editor' ).getEditedPostVisibility() );
	const showMisconfigurationMessage =
		postVisibility !== 'public' && accessLevel !== accessOptions.everybody.string;

	// Only show this for posts for now (subscriptions are only available on posts).
	const postWasEverPublished = useSelect(
		select =>
			select( editorStore ).getEditedPostAttribute( 'meta' )?.jetpack_post_was_ever_published,
		[]
	);

	// Subscriptions will not be triggered on private sites (on WordPress.com simple and WoA),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return null;
	}

	const enableSubscriptionsModule = () => {
		tracks.recordEvent( 'jetpack_editor_subscriptions_enable' );
		return changeStatus( true );
	};
	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	// In the paid-subscriber only, we send to a restricted number of subscribers
	const subscribersCount =
		accessLevel === accessOptions.paid_subscribers.string ? paidSubscribers : emailSubscribers;
	// We send to the social followers only when it is "everybody"
	const followersCount = accessLevel === accessOptions.everybody.string ? socialFollowers : 0;

	// Subscriptions will not be triggered for a post that was already published in the past and the email was sent.
	// We still need to render the access level selector, as historical posts need a way to edit their access level for people visiting them on the web.
	// TODO: Additionally, pages also can be protected. They will not send an email, but can be a resource that needs the acces selector.
	if ( postWasEverPublished ) {
		return (
			<AccessLevelSelectorPanel
				setPostMeta={ setPostMeta }
				accessLevel={ accessLevel }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
			/>
		);
	}

	// Do not show any panels when we have no info about the subscriber count, or it is too low.
	if (
		( ! Number.isFinite( emailSubscribers ) || emailSubscribers <= 0 ) &&
		( ! Number.isFinite( paidSubscribers ) || paidSubscribers <= 0 ) &&
		( ! Number.isFinite( socialFollowers ) || socialFollowers <= 0 ) &&
		isModuleActive
	) {
		return null;
	}

	const showNotices = Number.isFinite( subscribersCount ) && subscribersCount > 0 && isModuleActive;
	return (
		<>
			<AccessLevelSelectorPanel
				setPostMeta={ setPostMeta }
				accessLevel={ accessLevel }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
			/>
			<PluginPrePublishPanel
				className="jetpack-subscribe-pre-publish-panel"
				initialOpen
				title={
					<>
						{ __( 'Newsletter:', 'jetpack' ) }
						{ accessLevel && (
							<span className={ 'editor-post-publish-panel__link' }>
								{ accessOptions[ accessLevel ].label }
							</span>
						) }
					</>
				}
				icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
			>
				{ isNewsletterConfigured() && showMisconfigurationMessage && (
					<>
						<MisconfigurationWarning accessLevel={ accessLevel } />
						<br />
					</>
				) }
				{ ! showMisconfigurationMessage && showNotices && (
					<InspectorNotice>
						{ createInterpolateElement(
							followersCount !== 0
								? sprintf(
										/* translators: 1$s will be subscribers, %2$s will be social followers */
										__(
											'This post will reach <span>%1$s</span> and <span>%2$s</span>.',
											'jetpack'
										),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscribersCount, 'jetpack' ),
											numberFormat( subscribersCount )
										),
										sprintf(
											/* translators: %s will be a number of social followers */
											_n( '%s social follower', '%s social followers', followersCount, 'jetpack' ),
											numberFormat( followersCount )
										)
								  )
								: sprintf(
										/* translators: 1$s will be subscribers */
										__( 'This post will reach <span>%1$s</span>.', 'jetpack' ),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscribersCount, 'jetpack' ),
											numberFormat( subscribersCount )
										)
								  ),
							{ span: <span className="jetpack-subscribe-reader-count" /> }
						) }
					</InspectorNotice>
				) }

				{ isNewsletterConfigured() && (
					<NewsletterAccess
						setPostMeta={ setPostMeta }
						accessLevel={ accessLevel }
						withModal={ false }
						socialFollowers={ socialFollowers }
						emailSubscribers={ emailSubscribers }
						paidSubscribers={ paidSubscribers }
					/>
				) }
				{ ! isModuleActive && ! isLoadingModules && (
					<SubscriptionsPanelPlaceholder>
						<Button
							disabled={ isModuleActive || isChangingStatus }
							isBusy={ isChangingStatus }
							onClick={ enableSubscriptionsModule }
							variant="secondary"
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
			<PluginPostPublishPanel className="jetpack-subscribe-post-publish-panel" initialOpen>
				{ showNotices && (
					<InspectorNotice>
						{ createInterpolateElement(
							socialFollowers !== 0
								? sprintf(
										/* translators: 1$s will be subscribers, %2$s will be social followers */
										__(
											'This post was shared to <span>%1$s</span> and <span>%2$s</span>.',
											'jetpack'
										),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscribersCount, 'jetpack' ),
											numberFormat( subscribersCount )
										),
										sprintf(
											/* translators: %s will be a number of social followers */
											_n( '%s social follower', '%s social followers', followersCount, 'jetpack' ),
											numberFormat( followersCount )
										)
								  )
								: sprintf(
										/* translators: 1$s will be subscribers */
										__( 'This post was shared to <span>%1$s</span>.', 'jetpack' ),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscribersCount, 'jetpack' ),
											numberFormat( subscribersCount )
										)
								  ),
							{ span: <span className="jetpack-subscribe-reader-count" /> }
						) }
					</InspectorNotice>
				) }
			</PluginPostPublishPanel>
		</>
	);
}
