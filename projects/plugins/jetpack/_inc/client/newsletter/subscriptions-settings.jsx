import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isUnavailableInOfflineMode, isOfflineMode } from 'state/connection';
import {
	isSubscriptionModalEnabled,
	currentThemeIsBlockTheme,
	getSiteAdminUrl,
} from 'state/initial-state';
import { getModule } from 'state/modules';

const trackViewSubsClick = () => {
	analytics.tracks.recordJetpackClick( 'manage-subscribers' );
};

/**
 * Subscription settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Subscription settings component.
 */
function SubscriptionsSettings( props ) {
	const {
		hasSubscriptionModal,
		unavailableInOfflineMode,
		isLinked,
		isOffline,
		isSavingAnyOption,
		isStbEnabled,
		isStcEnabled,
		isSmEnabled,
		isSubscriptionsActive,
		siteRawUrl,
		subscriptions,
		toggleModuleNow,
		updateFormStateModuleOption,
		isBlockTheme,
		siteAdminUrl,
	} = props;

	const theme = useSelect( select => select( 'core' ).getCurrentTheme() );
	const themeSlug = theme?.stylesheet;

	const subscribeModalEditorUrl =
		siteAdminUrl && themeSlug
			? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
					postType: 'wp_template_part',
					postId: `${ themeSlug }//jetpack-subscribe-modal`,
					canvas: 'edit',
			  } )
			: null;

	const handleSubscribeToBlogToggleChange = useCallback( () => {
		updateFormStateModuleOption( 'subscriptions', 'stb_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeToCommentToggleChange = useCallback( () => {
		updateFormStateModuleOption( 'subscriptions', 'stc_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeModalToggleChange = useCallback( () => {
		updateFormStateModuleOption( 'subscriptions', 'sm_enabled' );
	}, [ updateFormStateModuleOption ] );

	const getSubClickableCard = () => {
		if ( unavailableInOfflineMode || ! isSubscriptionsActive || ! isLinked ) {
			return '';
		}

		return (
			<Card
				compact
				className="jp-settings-card__configure-link"
				onClick={ trackViewSubsClick }
				href={ getRedirectUrl( 'calypso-subscribers', {
					site: siteRawUrl,
				} ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Manage all subscribers', 'jetpack' ) }
			</Card>
		);
	};

	return (
		<SettingsCard { ...props } hideButton module="subscriptions">
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptions }
				support={ {
					text: __(
						'Allows readers to subscribe to your posts or comments, and receive notifications of new content by email.',
						'jetpack'
					),
					link: getRedirectUrl( 'jetpack-support-subscriptions' ),
				} }
			>
				<ModuleToggle
					slug="subscriptions"
					disabled={ unavailableInOfflineMode || ! isLinked }
					activated={ isSubscriptionsActive }
					toggling={ isSavingAnyOption( 'subscriptions' ) }
					toggleModule={ toggleModuleNow }
				>
					<span className="jp-form-toggle-explanation">{ subscriptions.description }</span>
				</ModuleToggle>
				{
					<FormFieldset>
						<ToggleControl
							checked={ isSubscriptionsActive && isStbEnabled }
							disabled={
								! isSubscriptionsActive ||
								unavailableInOfflineMode ||
								isSavingAnyOption( [ 'subscriptions' ] ) ||
								! isLinked
							}
							toggling={ isSavingAnyOption( [ 'stb_enabled' ] ) }
							onChange={ handleSubscribeToBlogToggleChange }
							label={ __(
								'Enable the “subscribe to site” option on your comment form',
								'jetpack'
							) }
						/>
						<ToggleControl
							checked={ isSubscriptionsActive && isStcEnabled }
							disabled={
								! isSubscriptionsActive ||
								unavailableInOfflineMode ||
								isSavingAnyOption( [ 'subscriptions' ] ) ||
								! isLinked
							}
							toggling={ isSavingAnyOption( [ 'stc_enabled' ] ) }
							onChange={ handleSubscribeToCommentToggleChange }
							label={ __(
								'Enable the “subscribe to comments” option on your comment form',
								'jetpack'
							) }
						/>
						{ hasSubscriptionModal && (
							<>
								<ToggleControl
									checked={ isSubscriptionsActive && isSmEnabled }
									disabled={
										! isSubscriptionsActive ||
										unavailableInOfflineMode ||
										isSavingAnyOption( [ 'subscriptions' ] ) ||
										! isLinked
									}
									toggling={ isSavingAnyOption( [ 'sm_enabled' ] ) }
									onChange={ handleSubscribeModalToggleChange }
									label={ __( 'Enable subscriber pop-up', 'jetpack' ) }
								/>
								<p className="jp-form-setting-explanation">
									{ __(
										'Grow subscribers by enabling a popup subscribe form that will show as readers scroll.',
										'jetpack'
									) }
									{ isBlockTheme && subscribeModalEditorUrl && (
										<>
											{ ' ' }
											<ExternalLink href={ subscribeModalEditorUrl }>
												{ __( 'Preview and edit.', 'jetpack' ) }
											</ExternalLink>
										</>
									) }
								</p>
							</>
						) }
					</FormFieldset>
				}
			</SettingsGroup>
			{ getSubClickableCard() }

			{ ! isLinked && ! isOffline && (
				<ConnectUserBar
					feature="subscriptions"
					featureLabel={ __( 'Newsletter', 'jetpack' ) }
					text={ __( 'Connect to manage your subscriptions settings.', 'jetpack' ) }
				/>
			) }
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isLinked: isCurrentUserLinked( state ),
			isOffline: isOfflineMode( state ),
			isSubscriptionsActive: ownProps.getOptionValue( 'subscriptions' ),
			hasSubscriptionModal: isSubscriptionModalEnabled( state ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, 'subscriptions' ),
			subscriptions: getModule( state, 'subscriptions' ),
			isStbEnabled: ownProps.getOptionValue( 'stb_enabled' ),
			isStcEnabled: ownProps.getOptionValue( 'stc_enabled' ),
			isSmEnabled: ownProps.getOptionValue( 'sm_enabled' ),
			isBlockTheme: currentThemeIsBlockTheme( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
		};
	} )( SubscriptionsSettings )
);
