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
import { getSubscriberCounts } from './api';
import './panel.scss';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';
import { NewsletterAccess, accessOptions } from './settings';
import { isNewsletterFeatureEnabled } from './utils';
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
					{ __( 'Learn more about the Subscriptions feature here.', 'jetpack' ) }
				</ExternalLink>
			</FlexItem>
		</Flex>
	);
};

export default function SubscribePanels() {
	const { tracks } = useAnalytics();
	const { isModuleActive, changeStatus, isLoadingModules, isChangingStatus } = useModuleStatus(
		name
	);
	const [ subscriberCount, setSubscriberCount ] = useState( null );
	const [ postMeta = [], setPostMeta ] = useEntityProp( 'postType', 'post', 'meta' );

	const accessLevel =
		postMeta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] ?? Object.keys( accessOptions )[ 0 ];

	const [ followerCount, setFollowerCount ] = useState( null );
	useEffect( () => {
		if ( ! isModuleActive ) {
			return;
		}
		getSubscriberCounts( counts => {
			setSubscriberCount( counts.email_subscribers );
			setFollowerCount( counts.social_followers );
		} );
	}, [ isModuleActive ] );

	// Only show this for posts for now (subscriptions are only available on posts).
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const postWasEverPublished = useSelect(
		select =>
			select( editorStore ).getEditedPostAttribute( 'meta' )?.jetpack_post_was_ever_published,
		[]
	);

	if ( 'post' !== postType ) {
		return null;
	}

	// Subscriptions will not be triggered for a post that was already published in the past
	if ( postWasEverPublished ) {
		return null;
	}

	// Subscriptions will not be triggered on private sites (on WordPress.com simple and WoA),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return null;
	}

	const enableSubscriptionsModule = () => {
		tracks.recordEvent( 'jetpack_editor_subscriptions_enable' );
		return changeStatus( true );
	};

	// Do not show any panels when we have no info about the subscriber count, or it is too low.
	if (
		( ! Number.isFinite( subscriberCount ) || subscriberCount <= 0 ) &&
		( ! Number.isFinite( followerCount ) || followerCount <= 0 ) &&
		isModuleActive
	) {
		return null;
	}

	const showNotices = Number.isFinite( subscriberCount ) && subscriberCount > 0 && isModuleActive;
	return (
		<>
			{ isNewsletterFeatureEnabled() && (
				<PluginDocumentSettingPanel title={ __( 'Newsletter', 'jetpack' ) }>
					<NewsletterAccess setPostMeta={ setPostMeta } accessLevel={ accessLevel } />
				</PluginDocumentSettingPanel>
			) }

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
				{ showNotices && (
					<InspectorNotice>
						{ createInterpolateElement(
							followerCount !== 0
								? sprintf(
										/* translators: 1$s will be subscribers, %2$s will be social followers */
										__(
											'This post will reach <span>%1$s</span> and <span>%2$s</span>.',
											'jetpack'
										),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscriberCount, 'jetpack' ),
											numberFormat( subscriberCount )
										),
										sprintf(
											/* translators: %s will be a number of social followers */
											_n( '%s social follower', '%s social followers', followerCount, 'jetpack' ),
											numberFormat( followerCount )
										)
								  )
								: sprintf(
										/* translators: 1$s will be subscribers */
										__( 'This post will reach <span>%1$s</span>.', 'jetpack' ),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscriberCount, 'jetpack' ),
											numberFormat( subscriberCount )
										)
								  ),
							{ span: <span className="jetpack-subscribe-reader-count" /> }
						) }
					</InspectorNotice>
				) }

				{ isNewsletterFeatureEnabled() && (
					<NewsletterAccess
						setPostMeta={ setPostMeta }
						accessLevel={ accessLevel }
						withModal={ false }
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
							{ __( 'Activate Subscriptions', 'jetpack' ) }
						</Button>
					</SubscriptionsPanelPlaceholder>
				) }
			</PluginPrePublishPanel>
			<PluginPostPublishPanel className="jetpack-subscribe-post-publish-panel" initialOpen>
				{ showNotices && (
					<InspectorNotice>
						{ createInterpolateElement(
							followerCount !== 0
								? sprintf(
										/* translators: 1$s will be subscribers, %2$s will be social followers */
										__(
											'This post was shared to <span>%1$s</span> and <span>%2$s</span>.',
											'jetpack'
										),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscriberCount, 'jetpack' ),
											numberFormat( subscriberCount )
										),
										sprintf(
											/* translators: %s will be a number of social followers */
											_n( '%s social follower', '%s social followers', followerCount, 'jetpack' ),
											numberFormat( followerCount )
										)
								  )
								: sprintf(
										/* translators: 1$s will be subscribers */
										__( 'This post was shared to <span>%1$s</span>.', 'jetpack' ),
										sprintf(
											/* translators: %s will be a number of subscribers */
											_n( '%s subscriber', '%s subscribers', subscriberCount, 'jetpack' ),
											numberFormat( subscriberCount )
										)
								  ),
							{ span: <span className="jetpack-subscribe-reader-count" /> }
						) }
					</InspectorNotice>
				) }
				{ ! isModuleActive && ! isLoadingModules && (
					<SubscriptionsPanelPlaceholder>
						<Button
							disabled={ isModuleActive || isChangingStatus }
							isBusy={ isChangingStatus }
							onClick={ enableSubscriptionsModule }
							variant="secondary"
						>
							{ __( 'Activate Subscriptions', 'jetpack' ) }
						</Button>
					</SubscriptionsPanelPlaceholder>
				) }
			</PluginPostPublishPanel>
		</>
	);
}
