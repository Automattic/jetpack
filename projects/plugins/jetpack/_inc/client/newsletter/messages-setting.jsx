import { __ } from '@wordpress/i18n';
import { FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';
import Textarea from '../components/textarea';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const MessagesSetting = props => {
	const { getOptionValue, isSavingAnyOption, subscriptionsModule, onOptionChange } = props;

	const changeWelcomeMessageState = useCallback(
		event => {
			const subscriptionOptionEvent = {
				target: { name: event.target.name, value: { welcome: event.target.value } },
			};
			onOptionChange( subscriptionOptionEvent );
		},
		[ onOptionChange ]
	);

	const welcomeMessage = getOptionValue( 'subscription_options' )?.welcome || '';

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Messages', 'jetpack' ) }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ isSavingAnyOption( [ 'subscription_options' ] ) }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
			>
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
				<p className="jp-form-setting-explanation">
					{ __(
						'You can use plain text or HTML tags in this textarea for formatting.',
						'jetpack'
					) }
				</p>
			</SettingsGroup>
		</SettingsCard>
	);
};

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			getOptionValue: ownProps.getOptionValue,
			isSavingAnyOption: ownProps.isSavingAnyOption,
			moduleName: ownProps.moduleName,
			onOptionChange: ownProps.onOptionChange,
		};
	} )( MessagesSetting )
);
