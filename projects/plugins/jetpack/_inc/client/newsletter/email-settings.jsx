import {
	RadioControl,
	ToggleControl,
	getRedirectUrl,
	Container,
	Col,
	Chip,
	Button as JetpackButton,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import SupportInfo from 'components/support-info';
import TextInput from 'components/text-input';
import analytics from 'lib/analytics';
import { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { isUnavailableInOfflineMode, isUnavailableInSiteConnectionMode } from 'state/connection';
import {
	getSiteTitle,
	getUserGravatar,
	getDisplayName,
	getNewsetterDateExample,
	getSiteAdminUrl,
	getCurrenUserEmailAddress,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import BylinePreview from './byline-preview';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const featuredImageInEmailSupportUrl = 'https://wordpress.com/support/featured-images/';
const subscriptionsAndNewslettersSupportUrl =
	'https://wordpress.com/support/subscriptions-and-newsletters/';
const FEATURED_IMAGE_IN_EMAIL_OPTION = 'wpcom_featured_image_in_email';
const SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION = 'wpcom_subscription_emails_use_excerpt';
const GRAVATER_OPTION = 'jetpack_gravatar_in_email';
const AUTHOR_OPTION = 'jetpack_author_in_email';
const POST_DATE_OPTION = 'jetpack_post_date_in_email';
const REPLY_TO_OPTION = 'jetpack_subscriptions_reply_to';
const FROM_NAME_OPTION = 'jetpack_subscriptions_from_name';

const EmailSettings = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		isGravatarEnabled,
		isAuthorEnabled,
		isPostDateEnabled,
		subscriptionEmailsUseExcerpt,
		subscriptionReplyTo,
		subscriptionFromName,
		updateFormStateAndSaveOptionValue,
		unavailableInSiteConnectionMode,
		gravatar,
		email,
		adminUrl,
		displayName,
		dateExample,
		siteName,
	} = props;

	const disabled = unavailableInOfflineMode || unavailableInSiteConnectionMode;
	const gravatarInputDisabled = disabled || isSavingAnyOption( [ GRAVATER_OPTION ] );
	const authorInputDisabled = disabled || isSavingAnyOption( [ AUTHOR_OPTION ] );
	const postDateInputDisabled = disabled || isSavingAnyOption( [ POST_DATE_OPTION ] );

	const [ bylineState, setBylineState ] = useState( {
		isGravatarEnabled,
		isAuthorEnabled,
		isPostDateEnabled,
	} );

	const handleEnableFeaturedImageInEmailToggleChange = useCallback( () => {
		const value = ! isFeaturedImageInEmailEnabled;
		updateFormStateAndSaveOptionValue( FEATURED_IMAGE_IN_EMAIL_OPTION, value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_toggle_featured_image_in_email', {
			value,
		} );
	}, [ isFeaturedImageInEmailEnabled, updateFormStateAndSaveOptionValue ] );

	const handleEnableGravatarToggleChange = useCallback( () => {
		const value = ! isGravatarEnabled;
		updateFormStateAndSaveOptionValue( GRAVATER_OPTION, value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_toggle_gravatar_in_email', {
			value,
		} );
		setBylineState( { ...bylineState, isGravatarEnabled: value } );
	}, [ isGravatarEnabled, updateFormStateAndSaveOptionValue, setBylineState, bylineState ] );

	const handleEnableAuthorToggleChange = useCallback( () => {
		const value = ! isAuthorEnabled;
		updateFormStateAndSaveOptionValue( AUTHOR_OPTION, value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_toggle_author_in_email', {
			value,
		} );
		setBylineState( { ...bylineState, isAuthorEnabled: value } );
	}, [ isAuthorEnabled, updateFormStateAndSaveOptionValue, setBylineState, bylineState ] );

	const handleEnablePostDateToggleChange = useCallback( () => {
		const value = ! isPostDateEnabled;
		updateFormStateAndSaveOptionValue( POST_DATE_OPTION, value );
		analytics.tracks.recordEvent( 'jetpack_newsletter_set_toggle_post_data_in_email', {
			value,
		} );
		setBylineState( { ...bylineState, isPostDateEnabled: value } );
	}, [ isPostDateEnabled, updateFormStateAndSaveOptionValue, setBylineState, bylineState ] );
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
				className="newsletter-group"
			>
				<FormLegend className="jp-form-label-wide">
					{ __( 'Email byline', 'jetpack' ) }
					<Chip type="new" text={ __( 'New', 'jetpack' ) } />
				</FormLegend>
				<p>
					{ __(
						'Customize the information you want to display below your post title in emails.',
						'jetpack'
					) }
				</p>
				<BylinePreview
					isGravatarEnabled={ bylineState.isGravatarEnabled }
					isAuthorEnabled={ bylineState.isAuthorEnabled }
					isPostDateEnabled={ bylineState.isPostDateEnabled }
					gravatar={ gravatar }
					displayName={ displayName }
					dateExample={ dateExample }
				/>
				<div className="email-settings__gravatar">
					<ToggleControl
						disabled={ gravatarInputDisabled }
						checked={ isGravatarEnabled }
						toogling={ isSavingAnyOption( [ GRAVATER_OPTION ] ) }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Show author avatar on your emails', 'jetpack' ) }
							</span>
						}
						onChange={ handleEnableGravatarToggleChange }
					/>
					{ bylineState.isGravatarEnabled && (
						<div className="email-settings__help-info">
							<div className="email-settings__gravatar-help-info">
								<img src={ gravatar } className="email-settings__gravatar-image" alt="" />
								<div>
									<div className="email-settings__gravatar-help-text">
										{ __(
											'We use Gravatar, a service that associates an avatar image with your primary email address.',
											'jetpack'
										) }
									</div>
									<JetpackButton
										isExternalLink={ true }
										href="https://gravatar.com/profile/avatars"
										variant="secondary"
										size="small"
									>
										{ __( 'Update your Gravatar', 'jetpack' ) }
									</JetpackButton>
								</div>
							</div>
						</div>
					) }
					<SupportInfo
						text={ sprintf(
							// translators: %s is the user's email address
							__(
								"The avatar comes from Gravatar, a universal avatar service. Your image may also appear on other sites using Gravatar when you're logged in with %s.",
								'jetpack'
							),
							email
						) }
						privacyLink="https://support.gravatar.com/account/data-privacy/"
					/>
				</div>
				<ToggleControl
					disabled={ authorInputDisabled }
					checked={ isAuthorEnabled }
					toogling={ isSavingAnyOption( [ AUTHOR_OPTION ] ) }
					label={
						<span className="jp-form-toggle-explanation">
							{ __( 'Show author display name', 'jetpack' ) }
						</span>
					}
					onChange={ handleEnableAuthorToggleChange }
				/>

				<ToggleControl
					disabled={ postDateInputDisabled }
					checked={ isPostDateEnabled }
					toogling={ isSavingAnyOption( [ POST_DATE_OPTION ] ) }
					label={
						<span className="jp-form-toggle-explanation">
							{ __( 'Add the post date', 'jetpack' ) }
						</span>
					}
					onChange={ handleEnablePostDateToggleChange }
				/>
				{ bylineState.isPostDateEnabled && (
					<div className="email-settings__help-info">
						{ createInterpolateElement(
							__(
								'You can customize the date format in your site’s <settingsLink>general settings</settingsLink>',
								'jetpack'
							),
							{
								settingsLink: (
									<JetpackButton
										variant="link"
										isExternalLink={ true }
										href={ adminUrl + 'options-general.php' }
									/>
								),
							}
						) }
					</div>
				) }
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
									{ __( 'Replies will be a public comment on the post', 'jetpack' ) }
								</span>
							),
							value: 'comment',
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
			isGravatarEnabled: ownProps.getOptionValue( GRAVATER_OPTION ),
			isPostDateEnabled: ownProps.getOptionValue( POST_DATE_OPTION ),
			isAuthorEnabled: ownProps.getOptionValue( AUTHOR_OPTION ),
			subscriptionEmailsUseExcerpt: ownProps.getOptionValue(
				SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION
			),
			email: getCurrenUserEmailAddress( state ),
			siteName: getSiteTitle( state ),
			gravatar: getUserGravatar( state ),
			displayName: getDisplayName( state ),
			adminUrl: getSiteAdminUrl( state ),
			subscriptionReplyTo: ownProps.getOptionValue( REPLY_TO_OPTION ),
			subscriptionFromName: ownProps.getOptionValue( FROM_NAME_OPTION ),
			dateExample: getNewsetterDateExample( state ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( EmailSettings )
);
