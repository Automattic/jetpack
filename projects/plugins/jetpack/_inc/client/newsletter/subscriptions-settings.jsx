// NOTE: @wordpress/ui has no ToggleControl primitive yet; falling back to
// @wordpress/components per the priority list.
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fieldset } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { useCallback } from 'react';
import { connect } from 'react-redux';
// NOTE: withModuleSettingsFormHelpers, SettingsCard, and SettingsGroup are
// Jetpack business-logic composites — not UI primitives — so they remain
// imported from _inc/client/components per the refactor rules.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_NEWSLETTER_JETPACK } from 'lib/plans/constants';
import {
	isCurrentUserLinked,
	isUnavailableInOfflineMode,
	isOfflineMode,
	hasConnectedOwner,
} from 'state/connection';
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
 * @return {import('react').Component} Subscription settings component.
 */
function SubscriptionsSettings( props ) {
	const {
		unavailableInOfflineMode,
		isSavingAnyOption,
		isStbEnabled,
		isStcEnabled,
		isSmEnabled,
		isSubscribeOverlayEnabled,
		isSubscribeFloatingEnabled,
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
		siteHasConnectedUser,
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

	const subscribeFloatingEditorUrl =
		siteAdminUrl && themeStylesheet
			? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
					postType: 'wp_template_part',
					postId: `${ themeStylesheet }//jetpack-subscribe-floating-button`,
					canvas: 'edit',
			  } )
			: null;

	const singlePostTemplateEditorUrl = siteAdminUrl
		? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
				postType: 'wp_template',
				postId: `${ themeStylesheet }//single`,
				canvas: 'edit',
		  } )
		: null;

	const headerTemplateEditorUrl = siteAdminUrl
		? addQueryArgs( `${ siteAdminUrl }site-editor.php`, {
				postType: 'wp_template',
				postId: `${ themeStylesheet }//index`,
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

	const handleSubscribeOverlayToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'jetpack_subscribe_overlay_enabled' );
	}, [ updateFormStateModuleOption ] );

	const handleSubscribeFloatingToggleChange = useCallback( () => {
		updateFormStateModuleOption(
			SUBSCRIPTIONS_MODULE_NAME,
			'jetpack_subscribe_floating_button_enabled'
		);
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

	const isDisabled = ! isSubscriptionsActive || unavailableInOfflineMode || ! siteHasConnectedUser;

	return (
		<SettingsCard
			{ ...props }
			hideButton
			feature={ FEATURE_NEWSLETTER_JETPACK }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			header={ __( 'Subscriptions', 'jetpack' ) }
			isDisabled={ ! siteHasConnectedUser }
		>
			<SettingsGroup
				disableInOfflineMode
				disableInSiteConnectionMode={ ! siteHasConnectedUser }
				module={ subscriptions }
			>
				<p>
					{ __(
						'Automatically add subscription forms to your site and turn visitors into subscribers.',
						'jetpack'
					) }
				</p>
				<Fieldset.Root className="jp-form-fieldset">
					<Fieldset.Legend className="jp-form-legend">
						{ __( 'Homepage and posts', 'jetpack' ) }
					</Fieldset.Legend>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isSubscribePostEndEnabled }
						disabled={
							isDisabled ||
							isSavingAnyOption( [ 'jetpack_subscriptions_subscribe_post_end_enabled' ] )
						}
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
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isSmEnabled }
						disabled={ isDisabled || isSavingAnyOption( [ 'sm_enabled' ] ) }
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
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isSubscribeOverlayEnabled }
						disabled={
							isDisabled || isSavingAnyOption( [ 'jetpack_subscribe_overlay_enabled' ] )
						}
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
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isSubscribeFloatingEnabled }
						disabled={
							isDisabled ||
							isSavingAnyOption( [ 'jetpack_subscribe_floating_button_enabled' ] )
						}
						onChange={ handleSubscribeFloatingToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( "Floating subscribe button on site's bottom corner", 'jetpack' ) }
								{ isBlockTheme && subscribeFloatingEditorUrl && (
									<>
										{ '. ' }
										<ExternalLink href={ subscribeFloatingEditorUrl }>
											{ __( 'Preview and edit', 'jetpack' ) }
										</ExternalLink>
									</>
								) }
							</span>
						}
					/>
				</Fieldset.Root>
				{ isSubscriptionSiteEditSupported && (
					<Fieldset.Root className="jp-form-fieldset">
						<Fieldset.Legend className="jp-form-legend">
							{ __( 'Navigation', 'jetpack' ) }
						</Fieldset.Legend>
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ isSubscriptionsActive && isSubscribeNavigationEnabled }
							disabled={
								isDisabled ||
								isSavingAnyOption( [
									'jetpack_subscriptions_subscribe_navigation_enabled',
								] )
							}
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
							__nextHasNoMarginBottom
							checked={ isSubscriptionsActive && isLoginNavigationEnabled }
							disabled={
								isDisabled ||
								isSavingAnyOption( [ 'jetpack_subscriptions_login_navigation_enabled' ] )
							}
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
					</Fieldset.Root>
				) }
				<Fieldset.Root className="jp-form-fieldset">
					<Fieldset.Legend className="jp-form-legend">
						{ __( 'Comments', 'jetpack' ) }
					</Fieldset.Legend>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isStbEnabled }
						disabled={ isDisabled || isSavingAnyOption( [ 'stb_enabled' ] ) }
						onChange={ handleSubscribeToBlogToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable the “subscribe to site” option on your comment form', 'jetpack' ) }
							</span>
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ isSubscriptionsActive && isStcEnabled }
						disabled={ isDisabled || isSavingAnyOption( [ 'stc_enabled' ] ) }
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
				</Fieldset.Root>
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
			isSubscribeFloatingEnabled: ownProps.getOptionValue(
				'jetpack_subscribe_floating_button_enabled'
			),
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
			siteHasConnectedUser: hasConnectedOwner( state ),
		};
	} )( SubscriptionsSettings )
);
