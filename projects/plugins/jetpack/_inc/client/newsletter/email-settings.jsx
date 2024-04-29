import { RadioControl, ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import emailValidator from 'email-validator';
import { useCallback, useState, useRef } from 'react';
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
const REPLY_TO_EMAIL = 'jetpack_subscriptions_reply_to_email';

//Check for feature flag
const urlParams = new URLSearchParams( window.location.search );
const isNewsletterReplyToEnabled = urlParams.get( 'enable-newsletter-replyto' ) === 'true';

const EmailSettings = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		subscriptionEmailsUseExcerpt,
		subscriptionReplyTo,
		subscriptionReplyToEmail,
		onOptionChange,
		updateFormStateAndSaveOptionValue,
		unavailableInSiteConnectionMode,
	} = props;

	const handleEnableFeaturedImageInEmailToggleChange = useCallback( () => {
		updateFormStateAndSaveOptionValue(
			FEATURED_IMAGE_IN_EMAIL_OPTION,
			! isFeaturedImageInEmailEnabled
		);
	}, [ isFeaturedImageInEmailEnabled, updateFormStateAndSaveOptionValue ] );

	const handleSubscriptionEmailsUseExcerptChange = useCallback(
		value => {
			updateFormStateAndSaveOptionValue(
				SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION,
				value === 'excerpt'
			);
		},
		[ updateFormStateAndSaveOptionValue ]
	);

	const handleSubscriptionReplyToChange = useCallback(
		value => {
			if ( value !== 'custom' ) {
				updateFormStateAndSaveOptionValue( { [ REPLY_TO_OPTION ]: value, [ REPLY_TO_EMAIL ]: '' } );
			} else {
				updateFormStateAndSaveOptionValue( REPLY_TO_OPTION, value );
			}
		},
		[ updateFormStateAndSaveOptionValue ]
	);

	const [ isEmailValid, setIsEmailValid ] = useState( 'not-checking' );
	const isTypingEmailTimeoutRef = useRef( 0 );

	const handleEmailBlur = useCallback(
		event => {
			if ( emailValidator.validate( event.target.value ) ) {
				setIsEmailValid( 'yes' );
			} else {
				setIsEmailValid( 'no' );
			}
		},
		[ setIsEmailValid ]
	);

	const handleSubscriptionReplyToEmailChange = useCallback(
		event => {
			setIsEmailValid( 'not-checking' );
			clearTimeout( isTypingEmailTimeoutRef.current );
			isTypingEmailTimeoutRef.current = setTimeout( () => {
				handleEmailBlur( event );
			}, 1000 );

			const subscriptionOptionEvent = {
				target: { name: event.target.name, value: event.target.value },
			};

			onOptionChange( subscriptionOptionEvent );
		},
		[ onOptionChange, handleEmailBlur, isTypingEmailTimeoutRef ]
	);

	const disabled = unavailableInOfflineMode || unavailableInSiteConnectionMode;
	const featuredImageInputDisabled =
		disabled || isSavingAnyOption( [ FEATURED_IMAGE_IN_EMAIL_OPTION ] );
	const excerptInputDisabled =
		disabled || isSavingAnyOption( [ SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION ] );

	const replyToInputDisabled = disabled || isSavingAnyOption( [ REPLY_TO_OPTION ] );
	const replyToEmailDisabled = disabled || isSavingAnyOption( [ REPLY_TO_EMAIL ] );

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Email configuration', 'jetpack' ) }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ disabled }
			hideButton={ subscriptionReplyTo !== 'custom' || isEmailValid === 'no' }
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
			{ isNewsletterReplyToEnabled && (
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
							'Sets the reply to email address for your newsletter emails. This is the email address that your subscribers send email to when they reply to the newsletter.',
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
							{ label: __( 'Replies are not allowed.', 'jetpack' ), value: 'no-reply' },
							{
								label: __( "Replies will be sent to the post author's email.", 'jetpack' ),
								value: 'author',
							},
							{
								label: __( 'Custom reply-to email.', 'jetpack' ),
								value: 'custom',
							},
						] }
						onChange={ handleSubscriptionReplyToChange }
					/>
					{ subscriptionReplyTo === 'custom' && (
						<fieldset className="jp-form-fieldset">
							<label className="jp-form-label-wide" htmlFor={ REPLY_TO_EMAIL }>
								{ __( 'Custom reply-to email address', 'jetpack' ) }
							</label>
							<TextInput
								id={ REPLY_TO_EMAIL }
								name={ REPLY_TO_EMAIL }
								type="email"
								value={ subscriptionReplyToEmail }
								onChange={ handleSubscriptionReplyToEmailChange }
								placeholder={ __( 'Enter reply-to email address', 'jetpack' ) }
								isError={ subscriptionReplyToEmail && isEmailValid === 'no' }
								onBlur={ handleEmailBlur }
								disabled={ replyToEmailDisabled }
								autocomplete="off"
							/>
							{ isEmailValid === 'no' && subscriptionReplyToEmail && (
								<span>
									{ sprintf(
										/* translators: placeholder is an email address. */
										__( '%s is not a valid email address.', 'jetpack' ),
										subscriptionReplyToEmail
									) }
								</span>
							) }
						</fieldset>
					) }
				</SettingsGroup>
			) }
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
			onOptionChange: ownProps.onOptionChange,
			subscriptionReplyTo: ownProps.getOptionValue( REPLY_TO_OPTION ),
			subscriptionReplyToEmail: ownProps.getOptionValue( REPLY_TO_EMAIL ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( EmailSettings )
);
