import { JetpackLogo, numberFormat } from '@automattic/jetpack-components';
import { isComingSoon, isPrivateSite } from '@automattic/jetpack-shared-extension-utils';
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
import { NewsletterAccess, accessOptions, MisconfigurationWarning } from './settings';
import { isNewsletterFeatureEnabled } from './utils';

function AccessLevelSelectorPanel( { setPostMeta, accessLevel } ) {
	const newsletterSettings = useSelect( select => {
		const newsletterPlans = select( 'jetpack/membership-products' )
			?.getProducts()
			?.filter( product => product.subscribe_as_site_subscriber );
		return {
			hasNewsletterPlans: newsletterPlans?.length !== 0,
		};
	}, [] );

	if ( ! isNewsletterFeatureEnabled() || ! newsletterSettings.hasNewsletterPlans ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel title={ __( 'Newsletter', 'jetpack' ) }>
			<NewsletterAccess setPostMeta={ setPostMeta } accessLevel={ accessLevel } />
		</PluginDocumentSettingPanel>
	);
}

export default function SubscribePanels() {
	const [ subscriberCount, setSubscriberCount ] = useState( null );
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ postMeta = [], setPostMeta ] = useEntityProp( 'postType', postType, 'meta' );

	const accessLevel =
		postMeta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] ?? Object.keys( accessOptions )[ 0 ];

	const [ followerCount, setFollowerCount ] = useState( null );
	useEffect( () => {
		getSubscriberCounts( counts => {
			setSubscriberCount( counts.email_subscribers );
			setFollowerCount( counts.social_followers );
		} );
	}, [] );

	// Can be “private”, “password”, or “public”.
	const postVisibility = useSelect( select => select( 'core/editor' ).getEditedPostVisibility() );
	const showMisconfigurationMessage = postVisibility !== 'public' && accessLevel !== 'everybody';

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

	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	// Subscriptions will not be triggered for a post that was already published in the past and the email was sent.
	// We still need to render the access level selector, as historical posts need a way to edit their access level for people visiting them on the web.
	// TODO: Additionally, pages also can be protected. They will not send an email, but can be a resource that needs the acces selector.
	if ( postWasEverPublished ) {
		return <AccessLevelSelectorPanel setPostMeta={ setPostMeta } accessLevel={ accessLevel } />;
	}

	// Do not show any panels when we have no info about the subscriber count, or it is too low.
	if (
		( ! Number.isFinite( subscriberCount ) || subscriberCount <= 0 ) &&
		( ! Number.isFinite( followerCount ) || followerCount <= 0 )
	) {
		return null;
	}

	const showNotices = Number.isFinite( subscriberCount ) && subscriberCount > 0;

	return (
		<>
			<AccessLevelSelectorPanel setPostMeta={ setPostMeta } accessLevel={ accessLevel } />
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
				{ isNewsletterFeatureEnabled() && showMisconfigurationMessage && (
					<>
						<MisconfigurationWarning accessLevel={ accessLevel } />
						<br />
					</>
				) }
				{ ! showMisconfigurationMessage && showNotices && (
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
			</PluginPostPublishPanel>
		</>
	);
}
