import { JetpackLogo } from '@automattic/jetpack-components';
import {
	isComingSoon,
	isPrivateSite,
	useModuleStatus,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Flex, FlexItem } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel, PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './panel.scss';
import { getSubscriberCounts } from './api';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, accessOptions } from './constants';
import { NewsletterAccessDocumentSettings, NewsletterAccessPrePublishSettings } from './settings';
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
	showMisconfigurationWarning,
} ) {
	// Only show the panels when the corresponding filter is enabled
	if ( ! isNewsletterFeatureEnabled() ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			title={ __( 'Newsletter access', 'jetpack' ) }
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
		</PluginDocumentSettingPanel>
	);
}

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
					{ __( 'Newsletter', 'jetpack' ) }
					{ accessLevel && (
						<span className={ 'editor-post-publish-panel__link' }>
							{ accessOptions[ accessLevel ].label }
						</span>
					) }
				</>
			}
			className="jetpack-subscribe-pre-publish-panel"
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			{ isNewsletterFeatureEnabled() && (
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
	const postVisibility = useSelect( select => select( 'core/editor' ).getEditedPostVisibility() );

	// Subscriptions will not be triggered on private sites ( on WordPress.com simple and WoA ),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return null;
	}

	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	const showMisconfigurationWarning =
		postVisibility !== 'public' && accessLevel !== accessOptions.everybody.key;

	return (
		<>
			<NewsletterEditorSettingsPanel
				accessLevel={ accessLevel }
				setPostMeta={ setPostMeta }
				socialFollowers={ socialFollowers }
				emailSubscribers={ emailSubscribers }
				paidSubscribers={ paidSubscribers }
				showMisconfigurationWarning={ showMisconfigurationWarning }
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
		</>
	);
}
