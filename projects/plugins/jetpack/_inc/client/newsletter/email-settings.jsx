import {
	RadioControl,
	ToggleControl,
	getRedirectUrl,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
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
import { getSiteTitle } from 'state/initial-state';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const featuredImageInEmailSupportUrl = 'https://wordpress.com/support/featured-images/';
const subscriptionsAndNewslettersSupportUrl =
	'https://wordpress.com/support/subscriptions-and-newsletters/';
const FEATURED_IMAGE_IN_EMAIL_OPTION = 'wpcom_featured_image_in_email';
const SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION = 'wpcom_subscription_emails_use_excerpt';
const REPLY_TO_OPTION = 'jetpack_subscriptions_reply_to';
const FROM_NAME_OPTION = 'jetpack_subscriptions_from_name';

const EmailSettings = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		subscriptionEmailsUseExcerpt,
		subscriptionReplyTo,
		subscriptionFromName,
		updateFormStateAndSaveOptionValue,
		unavailableInSiteConnectionMode,
		siteName,
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
	const fromNameInputDisabled = disabled || isSavingAnyOption( [ FROM_NAME_OPTION ] );

	const [ fromNameState, setFromNameState ] = useState( {
		value: subscriptionFromName,
		hasChanged: false,
	} );

	const handleSubscriptionFromNameChange = useCallback(
		event => {
			setFromNameState( {
				value: event.target.value,
				hasChanged: subscriptionFromName !== event.target.value,
			} );
		},
		[ setFromNameState, subscriptionFromName ]
	);

	const handleSubscriptionFromNameChangeClick = useCallback( () => {
		updateFormStateAndSaveOptionValue( FROM_NAME_OPTION, fromNameState.value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_from_name_click', {
			value: fromNameState.value,
		} );
		setFromNameState( { value: fromNameState.value, hasChanged: false } );
	}, [ fromNameState, updateFormStateAndSaveOptionValue ] );
	const exampleEmail =
		subscriptionReplyTo !== 'author' ? 'donotreply@wordpress.com' : 'author-name@example.com';
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
					<Col sm={ 3 } md={ 4 } lg={ 4 }>
						<TextInput
							value={ fromNameState.value }
							disabled={ fromNameInputDisabled }
							onChange={ handleSubscriptionFromNameChange }
							placeholder={ siteName || __( 'Enter sender name', 'jetpack' ) }
						/>
					</Col>
					<Col sm={ 1 } md={ 1 } lg={ 1 }>
						<Button
							primary
							rna
							onClick={ handleSubscriptionFromNameChangeClick }
							disabled={ fromNameInputDisabled || ! fromNameState.hasChanged }
						>
							{ __( 'Save', 'jetpack' ) }
						</Button>
					</Col>
					<Col className="sender-name-example">
						{ sprintf(
							/* translators: 1. placeholder is the user entered value for From Name, 2. is the example email */
							__( 'Example: %1$s <%2$s>', 'jetpack' ),
							fromNameState.value || siteName,
							exampleEmail
						) }
					</Col>
				</Container>
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
			siteName: getSiteTitle( state ),
			subscriptionReplyTo: ownProps.getOptionValue( REPLY_TO_OPTION ),
			subscriptionFromName: ownProps.getOptionValue( FROM_NAME_OPTION ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( EmailSettings )
);
