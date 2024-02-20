import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { FormLabel, FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isUnavailableInOfflineMode, isOfflineMode } from 'state/connection';
import {
	currentThemeIsBlockTheme,
	currentThemeStylesheet,
	getSiteAdminUrl,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import Textarea from '../components/textarea';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

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
		themeStylesheet,
		blogID,
		onOptionChange,
	} = props;

	const welcomeMessage = props.getOptionValue( 'subscription_options' )?.welcome || '';
	const subscribeModalEditorUrl =
		siteAdminUrl && themeStylesheet
			? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
					postType: 'wp_template_part',
					postId: `${ themeStylesheet }//jetpack-subscribe-modal`,
					canvas: 'edit',
			  } )
			: null;

	const handleSubscribeToBlogToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'stb_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeToCommentToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'stc_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeModalToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'sm_enabled' );
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
					site: blogID ?? siteRawUrl,
				} ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Manage all subscribers', 'jetpack' ) }
			</Card>
		);
	};

	const isDisabled =
		! isSubscriptionsActive ||
		unavailableInOfflineMode ||
		isSavingAnyOption( [ SUBSCRIPTIONS_MODULE_NAME ] );

	const changeWelcomeMessageState = useCallback(
		event => {
			const subscriptionOptionEvent = {
				target: { name: event.target.name, value: { welcome: event.target.value } },
			};
			onOptionChange( subscriptionOptionEvent );
		},
		[ onOptionChange ]
	);

	return (
		<>
			<SettingsCard { ...props } hideButton module={ SUBSCRIPTIONS_MODULE_NAME }>
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
						disabled={ unavailableInOfflineMode }
						activated={ isSubscriptionsActive }
						toggling={ isSavingAnyOption( SUBSCRIPTIONS_MODULE_NAME ) }
						toggleModule={ toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">{ subscriptions.description }</span>
					</ModuleToggle>
					{
						<FormFieldset>
							<ToggleControl
								checked={ isSubscriptionsActive && isStbEnabled }
								disabled={ isDisabled }
								toggling={ isSavingAnyOption( [ 'stb_enabled' ] ) }
								onChange={ handleSubscribeToBlogToggleChange }
								label={ __(
									'Enable the “subscribe to site” option on your comment form',
									'jetpack'
								) }
							/>
							<ToggleControl
								checked={ isSubscriptionsActive && isStcEnabled }
								disabled={ isDisabled }
								toggling={ isSavingAnyOption( [ 'stc_enabled' ] ) }
								onChange={ handleSubscribeToCommentToggleChange }
								label={ __(
									'Enable the “subscribe to comments” option on your comment form',
									'jetpack'
								) }
							/>
							<ToggleControl
								checked={ isSubscriptionsActive && isSmEnabled }
								disabled={ isDisabled }
								toggling={ isSavingAnyOption( [ 'sm_enabled' ] ) }
								onChange={ handleSubscribeModalToggleChange }
								label={ __( 'Enable subscription pop-up', 'jetpack' ) }
							/>
							<p className="jp-form-setting-explanation">
								{ __(
									'Automatically add a subscription form pop-up to every post and turn visitors into subscribers. It will appear as readers scroll through your posts.',
									'jetpack'
								) }
								{ isBlockTheme && subscribeModalEditorUrl && (
									<>
										{ ' ' }
										<ExternalLink href={ subscribeModalEditorUrl }>
											{ __( 'Preview and edit the pop-up', 'jetpack' ) }
										</ExternalLink>
									</>
								) }
							</p>
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
			<SettingsCard
				{ ...props }
				header={ __( 'Messages', 'jetpack' ) }
				module="subscriptions"
				saveDisabled={ props.isSavingAnyOption( [ 'subscription_options' ] ) }
			>
				<SettingsGroup hasChild disableInOfflineMode module={ subscriptions }>
					<p className="jp-settings-card__email-settings">
						{ __(
							'These settings change the emails sent from your site to your readers.',
							'jetpack'
						) }
					</p>
					<FormLabel>
						<span className="jp-form-label-wide email-settings__title">
							{ __( 'Welcome email message', 'jetpack' ) }
						</span>
						<Textarea
							name={ 'subscription_options' }
							value={ welcomeMessage }
							onChange={ changeWelcomeMessageState }
						/>
					</FormLabel>
				</SettingsGroup>
			</SettingsCard>
		</>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isLinked: isCurrentUserLinked( state ),
			isOffline: isOfflineMode( state ),
			isSubscriptionsActive: ownProps.getOptionValue( SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			subscriptions: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isStbEnabled: ownProps.getOptionValue( 'stb_enabled' ),
			isStcEnabled: ownProps.getOptionValue( 'stc_enabled' ),
			isSmEnabled: ownProps.getOptionValue( 'sm_enabled' ),
			isBlockTheme: currentThemeIsBlockTheme( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			themeStylesheet: currentThemeStylesheet( state ),
		};
	} )( SubscriptionsSettings )
);
