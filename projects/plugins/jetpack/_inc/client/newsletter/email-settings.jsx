import {
	RadioControl,
	ToggleControl,
	getRedirectUrl,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import TextInput from 'components/text-input';
import analytics from 'lib/analytics';
import { useCallback, useState } from 'react';
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
const SENDER_NAME_OPTION = 'jetpack_subscriptions_sender_name';
//Check for feature flag
const urlParams = new URLSearchParams( window.location.search );
const isNewsletterReplyToNameEnabled = urlParams.get( 'enable-newsletter-sender-name' ) === 'true';

const { blogname } = window?.JP_CONNECTION_INITIAL_STATE ? window.JP_CONNECTION_INITIAL_STATE : {};

const EmailSettings = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		subscriptionEmailsUseExcerpt,
		subscriptionReplyTo,
		subscriptionReplyToName,
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
	const replyToNameInputDisabled = disabled || isSavingAnyOption( [ SENDER_NAME_OPTION ] );

	const [ replyToNameState, setReplyToNameState ] = useState( {
		value: subscriptionReplyToName,
		hasChanged: false,
	} );

	const handleSubscriptionReplyToNameChange = useCallback(
		event => {
			setReplyToNameState( {
				value: event.target.value,
				hasChanged: subscriptionReplyToName !== event.target.value,
			} );
		},
		[ setReplyToNameState, subscriptionReplyToName ]
	);

	const handleSubscriptionReplyToNameChangeClick = useCallback( () => {
		updateFormStateAndSaveOptionValue( SENDER_NAME_OPTION, replyToNameState.value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_reply_to_name', {
			value: replyToNameState.value,
		} );
		setReplyToNameState( { value: replyToNameState.value, hasChanged: false } );
	}, [ replyToNameState, updateFormStateAndSaveOptionValue ] );

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
					label={
						<span className="jp-form-toggle-explanation">
							{ __( 'Enable featured image on your new post emails', 'jetpack' ) }
						</span>
					}
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
					className="jp-form-radio-gap"
					selected={ subscriptionEmailsUseExcerpt ? 'excerpt' : 'full' }
					disabled={ excerptInputDisabled }
					options={ [
						{
							label: (
								<span className="jp-form-toggle-explanation">{ __( 'Full text', 'jetpack' ) }</span>
							),
							value: 'full',
						},
						{
							label: (
								<span className="jp-form-toggle-explanation">{ __( 'Excerpt', 'jetpack' ) }</span>
							),
							value: 'excerpt',
						},
					] }
					onChange={ handleSubscriptionEmailsUseExcerptChange }
				/>
			</SettingsGroup>
			{ isNewsletterReplyToNameEnabled && (
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ subscriptionsModule }
					className="newsletter-group"
				>
					<FormLegend className="jp-form-label-wide">{ __( 'Sender name', 'jetpack' ) }</FormLegend>
					<p>
						{ __(
							"This is the name that appears in subscribers' inboxes. It's usually the name of your newsletter or the author.",
							'jetpack'
						) }
					</p>
					<Container horizontalGap={ 0 } fluid className="sender-name">
						<Col sm={ 4 } md={ 4 } lg={ 4 }>
							<TextInput
								value={ replyToNameState.value }
								disabled={ replyToNameInputDisabled }
								onChange={ handleSubscriptionReplyToNameChange }
								placeholder={ blogname || __( 'Enter sender name', 'jetpack' ) }
							/>
						</Col>
						<Col sm={ 1 } md={ 1 } lg={ 1 }>
							<Button
								primary
								rna
								onClick={ handleSubscriptionReplyToNameChangeClick }
								disabled={ replyToNameInputDisabled || ! replyToNameState.hasChanged }
							>
								{ __( 'Save', 'jetpack' ) }
							</Button>
						</Col>
					</Container>
				</SettingsGroup>
			) }
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
					{ __( 'Reply-to email', 'jetpack' ) }
				</FormLegend>
				<p>
					{ __(
						'Choose who receives emails when subscribers reply to your newsletter.',
						'jetpack'
					) }
				</p>
				<RadioControl
					className="jp-form-radio-gap"
					selected={ subscriptionReplyTo || 'no-reply' }
					disabled={ replyToInputDisabled }
					options={ [
						{
							label: (
								<span className="jp-form-toggle-explanation">
									{ __( 'Replies are not allowed', 'jetpack' ) }
								</span>
							),
							value: 'no-reply',
						},
						{
							label: (
								<span className="jp-form-toggle-explanation">
									{ __( "Replies will be sent to the post author's email", 'jetpack' ) }
								</span>
							),
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
			subscriptionReplyToName: ownProps.getOptionValue( SENDER_NAME_OPTION ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( EmailSettings )
);
