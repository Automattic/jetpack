import { ToggleControl } from '@automattic/jetpack-components';
import { ExternalLink, RadioControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { isUnavailableInOfflineMode } from 'state/connection';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const featuredImageInEmailSupportUrl = 'https://wordpress.com/support/featured-images/';
const subscriptionsAndNewslettersSupportUrl =
	'https://wordpress.com/support/subscriptions-and-newsletters/';
const FEATURED_IMAGE_IN_EMAIL_OPTION = 'wpcom_featured_image_in_email';
const SUBSCRIPTION_EMAILS_USE_EXCERPT_OPTION = 'wpcom_subscription_emails_use_excerpt';
const FULL_TEXT_VALUE = 'full_text';
const EXCERPT_VALUE = 'excerpt';

const EmailSetting = props => {
	const {
		isSavingAnyOption,
		subscriptionsModule,
		unavailableInOfflineMode,
		isFeaturedImageInEmailEnabled,
		subscriptionEmailsUseExcerpt,
		updateFormStateAndSaveOptionValue,
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
				value === EXCERPT_VALUE
			);
		},
		[ updateFormStateAndSaveOptionValue ]
	);

	const disabled = unavailableInOfflineMode || isSavingAnyOption( [ SUBSCRIPTIONS_MODULE_NAME ] );

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Email', 'jetpack' ) }
			hideButton
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ disabled }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
			>
				<ToggleControl
					disabled={ disabled }
					checked={ isFeaturedImageInEmailEnabled }
					toogling={ isSavingAnyOption( [ FEATURED_IMAGE_IN_EMAIL_OPTION ] ) }
					label={ __( 'Enable featured image on your new post emails', 'jetpack' ) }
					onChange={ handleEnableFeaturedImageInEmailToggleChange }
				/>

				<p className="jp-form-setting-explanation">
					{ createInterpolateElement(
						__(
							"Includes your post's featured image in the email sent out to your readers. <a>Learn more about the featured image</a>",
							'jetpack'
						),
						{
							a: <ExternalLink href={ featuredImageInEmailSupportUrl } />,
						}
					) }
				</p>
			</SettingsGroup>

			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
			>
				<RadioControl
					disabled={ disabled }
					selected={ subscriptionEmailsUseExcerpt ? EXCERPT_VALUE : FULL_TEXT_VALUE }
					label={ __( 'For each new post email, include', 'jetpack' ) }
					options={ [
						{ label: __( 'Full text', 'jetpack' ), value: FULL_TEXT_VALUE },
						{ label: __( 'Excerpt', 'jetpack' ), value: EXCERPT_VALUE },
					] }
					onChange={ handleSubscriptionEmailsUseExcerptChange }
				/>

				<p className="jp-form-setting-explanation">
					{ createInterpolateElement(
						__(
							'Sets whether email subscribers can read full posts in emails or just an excerpt and link to the full version of the post. <a>Learn more about sending emails</a>',
							'jetpack'
						),
						{
							a: <ExternalLink href={ subscriptionsAndNewslettersSupportUrl } />,
						}
					) }
				</p>
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
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
		};
	} )( EmailSetting )
);
