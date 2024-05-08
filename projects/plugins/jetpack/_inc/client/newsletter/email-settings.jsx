import { RadioControl, ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { isUnavailableInOfflineMode, isUnavailableInSiteConnectionMode } from 'state/connection';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const featuredImageInEmailSupportUrl = 'https://wordpress.com/support/featured-images/';
const subscriptionsAndNewslettersSupportUrl =
	'https://wordpress.com/support/subscriptions-and-newsletters/';
const FEATURED_IMAGE_IN_EMAIL_OPTION = 'wpcom_featured_image_in_email';
const SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION = 'wpcom_subscription_emails_use_excerpt';
const REPLY_TO_OPTION = 'jetpack_subscriptions_reply_to';

const EmailSettings = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		subscriptionEmailsUseExcerpt,
		subscriptionReplyTo,
		updateFormStateAndSaveOptionValue,
		unavailableInSiteConnectionMode,
	} = props;

	const handleEnableFeaturedImageInEmailToggleChange = useCallback( () => {
		const value = ! isFeaturedImageInEmailEnabled;
		updateFormStateAndSaveOptionValue( FEATURED_IMAGE_IN_EMAIL_OPTION, value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_toggle_featured_image_in_email', {
			value,
		} );
	}, [ isFeaturedImageInEmailEnabled, updateFormStateAndSaveOptionValue ] );

	const handleSubscriptionEmailsUseExcerptChange = useCallback(
		value => {
			updateFormStateAndSaveOptionValue(
				SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION,
				value === 'excerpt'
			);
			analytics.tracks.recordEvent( 'jetpack_newsletter_set_emails_use_excerpt', { value } );
		},
		[ updateFormStateAndSaveOptionValue ]
	);

	const handleSubscriptionReplyToChange = useCallback(
		value => {
			updateFormStateAndSaveOptionValue( REPLY_TO_OPTION, value );
			analytics.tracks.recordEvent( 'jetpack_newsletter_set_reply_to', { value } );
		},
		[ updateFormStateAndSaveOptionValue ]
	);

	const disabled = unavailableInOfflineMode || unavailableInSiteConnectionMode;
	const featuredImageInputDisabled =
		disabled || isSavingAnyOption( [ FEATURED_IMAGE_IN_EMAIL_OPTION ] );
	const excerptInputDisabled =
		disabled || isSavingAnyOption( [ SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION ] );

	const replyToInputDisabled = disabled || isSavingAnyOption( [ REPLY_TO_OPTION ] );

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Email configuration', 'jetpack' ) }
			hideButton
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ disabled }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
				support={ {
					link: featuredImageInEmailSupportUrl,
					text: __(
						"Includes your post's featured image in the email sent out to your readers.",
						'jetpack'
					),
				} }
			>
				<ToggleControl
					disabled={ featuredImageInputDisabled }
					checked={ isFeaturedImageInEmailEnabled }
					toogling={ isSavingAnyOption( [ FEATURED_IMAGE_IN_EMAIL_OPTION ] ) }
					label={ __( 'Enable featured image on your new post emails', 'jetpack' ) }
					onChange={ handleEnableFeaturedImageInEmailToggleChange }
				/>
			</SettingsGroup>

			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
				support={ {
					link: subscriptionsAndNewslettersSupportUrl,
					text: __(
						'Sets whether email subscribers can read full posts in emails or just an excerpt and link to the full version of the post.',
						'jetpack'
					),
				} }
			>
				<FormLegend className="jp-form-label-wide">
					{ __( 'For each new post email, include', 'jetpack' ) }
				</FormLegend>

				<RadioControl
					selected={ subscriptionEmailsUseExcerpt ? 'excerpt' : 'full' }
					disabled={ excerptInputDisabled }
					options={ [
						{ label: __( 'Full text', 'jetpack' ), value: 'full' },
						{ label: __( 'Excerpt', 'jetpack' ), value: 'excerpt' },
					] }
					onChange={ handleSubscriptionEmailsUseExcerptChange }
				/>
			</SettingsGroup>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
				support={ {
					link: getRedirectUrl( 'jetpack-support-subscriptions', {
						anchor: 'reply-to-email-address',
					} ),
					text: __(
						"Sets the reply to email address for your newsletter emails. It's the email where subscribers send their replies.",
						'jetpack'
					),
				} }
			>
				<FormLegend className="jp-form-label-wide">
					{ __( 'Reply-to settings', 'jetpack' ) }
				</FormLegend>
				<p>
					{ __(
						'Choose who receives emails when subscribers reply to your newsletter.',
						'jetpack'
					) }
				</p>
				<RadioControl
					selected={ subscriptionReplyTo || 'no-reply' }
					disabled={ replyToInputDisabled }
					options={ [
						{ label: __( 'Replies are not allowed', 'jetpack' ), value: 'no-reply' },
						{
							label: __( "Replies will be sent to the post author's email", 'jetpack' ),
							value: 'author',
						},
					] }
					onChange={ handleSubscriptionReplyToChange }
				/>
			</SettingsGroup>
		</SettingsCard>
	);
};

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			moduleName: ownProps.moduleName,
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isSavingAnyOption: ownProps.isSavingAnyOption,
			isFeaturedImageInEmailEnabled: ownProps.getOptionValue( FEATURED_IMAGE_IN_EMAIL_OPTION ),
			subscriptionEmailsUseExcerpt: ownProps.getOptionValue(
				SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION
			),
			subscriptionReplyTo: ownProps.getOptionValue( REPLY_TO_OPTION ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( EmailSettings )
);
