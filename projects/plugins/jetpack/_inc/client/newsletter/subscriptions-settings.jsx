import { ToggleControl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { FormLegend, FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isUnavailableInOfflineMode, isOfflineMode } from 'state/connection';
import {
	currentThemeIsBlockTheme,
	currentThemeStylesheet,
	getSiteAdminUrl,
	subscriptionSiteEditSupported,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

/**
 * Subscription settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Subscription settings component.
 */
function SubscriptionsSettings( props ) {
	const {
		unavailableInOfflineMode,
		isSavingAnyOption,
		isStbEnabled,
		isStcEnabled,
		isSmEnabled,
		isSubscribeOverlayEnabled,
		isSubscribePostEndEnabled,
		isLoginNavigationEnabled,
		isSubscribeNavigationEnabled,
		isSubscriptionSiteEditSupported,
		isSubscriptionsActive,
		subscriptions,
		updateFormStateModuleOption,
		isBlockTheme,
		siteAdminUrl,
		themeStylesheet,
	} = props;

	const subscribeModalEditorUrl =
		siteAdminUrl && themeStylesheet
			? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
					postType: 'wp_template_part',
					postId: `${ themeStylesheet }//jetpack-subscribe-modal`,
					canvas: 'edit',
			  } )
			: null;

	const subscribeOverlayEditorUrl =
		siteAdminUrl && themeStylesheet
			? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
					postType: 'wp_template_part',
					postId: `${ themeStylesheet }//jetpack-subscribe-overlay`,
					canvas: 'edit',
			  } )
			: null;

	const singlePostTemplateEditorUrl = siteAdminUrl
		? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
				postType: 'wp_template',
				postId: `${ themeStylesheet }//single`,
		  } )
		: null;

	const headerTemplateEditorUrl = siteAdminUrl
		? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
				postType: 'wp_template',
				postId: `${ themeStylesheet }//index`,
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

	const handleSubscribeOverlayToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'jetpack_subscribe_overlay_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribePostEndToggleChange = useCallback( () => {
		updateFormStateModuleOption(
			SUBSCRIPTIONS_MODULE_NAME,
			'jetpack_subscriptions_subscribe_post_end_enabled'
		);
	}, [ updateFormStateModuleOption ] );

	const handleLoginNavigationToggleChange = useCallback( () => {
		updateFormStateModuleOption(
			SUBSCRIPTIONS_MODULE_NAME,
			'jetpack_subscriptions_login_navigation_enabled'
		);
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeNavigationToggleChange = useCallback( () => {
		updateFormStateModuleOption(
			SUBSCRIPTIONS_MODULE_NAME,
			'jetpack_subscriptions_subscribe_navigation_enabled'
		);
	}, [ updateFormStateModuleOption ] );

	const isDisabled = ! isSubscriptionsActive || unavailableInOfflineMode;

	return (
		<SettingsCard
			{ ...props }
			hideButton
			module={ SUBSCRIPTIONS_MODULE_NAME }
			header={ __( 'Subscriptions', 'jetpack' ) }
		>
			<SettingsGroup disableInOfflineMode disableInSiteConnectionMode module={ subscriptions }>
				<p>
					{ __(
						'Automatically add subscription forms to your site and turn visitors into subscribers.',
						'jetpack'
					) }
				</p>
				<FormFieldset>
					<FormLegend>{ __( 'Homepage and posts', 'jetpack' ) }</FormLegend>
					<ToggleControl
						checked={ isSubscriptionsActive && isSubscribePostEndEnabled }
						disabled={ isDisabled }
						toggling={ isSavingAnyOption( [ 'jetpack_subscriptions_subscribe_post_end_enabled' ] ) }
						onChange={ handleSubscribePostEndToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Add the Subscribe Block at the end of each post', 'jetpack' ) }

								{ isSubscriptionSiteEditSupported && singlePostTemplateEditorUrl && (
									<>
										{ '. ' }
										<ExternalLink href={ singlePostTemplateEditorUrl }>
											{ __( 'Preview and edit', 'jetpack' ) }
										</ExternalLink>
									</>
								) }
							</span>
						}
					/>
					<ToggleControl
						checked={ isSubscriptionsActive && isSmEnabled }
						disabled={ isDisabled }
						toggling={ isSavingAnyOption( [ 'sm_enabled' ] ) }
						onChange={ handleSubscribeModalToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Show subscription pop-up when scrolling a post', 'jetpack' ) }
								{ isBlockTheme && subscribeModalEditorUrl && (
									<>
										{ '. ' }
										<ExternalLink href={ subscribeModalEditorUrl }>
											{ __( 'Preview and edit', 'jetpack' ) }
										</ExternalLink>
									</>
								) }
							</span>
						}
					/>
					<ToggleControl
						checked={ isSubscriptionsActive && isSubscribeOverlayEnabled }
						disabled={ isDisabled }
						toggling={ isSavingAnyOption( [ 'jetpack_subscribe_overlay_enabled' ] ) }
						onChange={ handleSubscribeOverlayToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Subscription overlay on homepage', 'jetpack' ) }
								{ isBlockTheme && subscribeOverlayEditorUrl && (
									<>
										{ '. ' }
										<ExternalLink href={ subscribeOverlayEditorUrl }>
											{ __( 'Preview and edit', 'jetpack' ) }
										</ExternalLink>
									</>
								) }
							</span>
						}
					/>
				</FormFieldset>
				{ isSubscriptionSiteEditSupported && (
					<FormFieldset>
						<FormLegend>{ __( 'Navigation', 'jetpack' ) }</FormLegend>
						<ToggleControl
							checked={ isSubscriptionsActive && isSubscribeNavigationEnabled }
							disabled={ isDisabled }
							toggling={ isSavingAnyOption( [
								'jetpack_subscriptions_subscribe_navigation_enabled',
							] ) }
							onChange={ handleSubscribeNavigationToggleChange }
							label={
								<span className="jp-form-toggle-explanation">
									{ __( 'Add the Subscribe block to the navigation', 'jetpack' ) }
									{ headerTemplateEditorUrl && (
										<>
											{ '. ' }
											<ExternalLink href={ headerTemplateEditorUrl }>
												{ __( 'Preview and edit', 'jetpack' ) }
											</ExternalLink>
										</>
									) }
								</span>
							}
						/>
						<ToggleControl
							checked={ isSubscriptionsActive && isLoginNavigationEnabled }
							disabled={ isDisabled }
							toggling={ isSavingAnyOption( [ 'jetpack_subscriptions_login_navigation_enabled' ] ) }
							onChange={ handleLoginNavigationToggleChange }
							label={
								<span className="jp-form-toggle-explanation">
									{ __( 'Add the Subscriber Login block to the navigation', 'jetpack' ) }
									{ headerTemplateEditorUrl && (
										<>
											{ '. ' }
											<ExternalLink href={ headerTemplateEditorUrl }>
												{ __( 'Preview and edit', 'jetpack' ) }
											</ExternalLink>
										</>
									) }
								</span>
							}
						/>
					</FormFieldset>
				) }
				<FormFieldset>
					<FormLegend>{ __( 'Comments', 'jetpack' ) }</FormLegend>
					<ToggleControl
						checked={ isSubscriptionsActive && isStbEnabled }
						disabled={ isDisabled }
						toggling={ isSavingAnyOption( [ 'stb_enabled' ] ) }
						onChange={ handleSubscribeToBlogToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable the “subscribe to site” option on your comment form', 'jetpack' ) }
							</span>
						}
					/>
					<ToggleControl
						checked={ isSubscriptionsActive && isStcEnabled }
						disabled={ isDisabled }
						toggling={ isSavingAnyOption( [ 'stc_enabled' ] ) }
						onChange={ handleSubscribeToCommentToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __(
									'Enable the “subscribe to comments” option on your comment form',
									'jetpack'
								) }
							</span>
						}
					/>
				</FormFieldset>
			</SettingsGroup>
		</SettingsCard>
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
			isSubscribeOverlayEnabled: ownProps.getOptionValue( 'jetpack_subscribe_overlay_enabled' ),
			isSubscribePostEndEnabled: ownProps.getOptionValue(
				'jetpack_subscriptions_subscribe_post_end_enabled'
			),
			isLoginNavigationEnabled: ownProps.getOptionValue(
				'jetpack_subscriptions_login_navigation_enabled'
			),
			isSubscribeNavigationEnabled: ownProps.getOptionValue(
				'jetpack_subscriptions_subscribe_navigation_enabled'
			),
			isSubscriptionSiteEditSupported: subscriptionSiteEditSupported( state ),
			isBlockTheme: currentThemeIsBlockTheme( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			themeStylesheet: currentThemeStylesheet( state ),
		};
	} )( SubscriptionsSettings )
);
