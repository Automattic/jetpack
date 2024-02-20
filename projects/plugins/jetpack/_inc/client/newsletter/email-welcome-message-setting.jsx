import { __ } from '@wordpress/i18n';
import { FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import Textarea from '../components/textarea';

const EmailWelcomeMessageSetting = props => {
	const { getOptionValue, isSavingAnyOption, moduleName, onOptionChange } = props;

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
			module={ moduleName }
			saveDisabled={ isSavingAnyOption( [ 'subscription_options' ] ) }
		>
			<SettingsGroup hasChild disableInOfflineMode module={ moduleName }>
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
	);
};

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			getOptionValue: ownProps.getOptionValue,
			isSavingAnyOption: ownProps.isSavingAnyOption,
			moduleName: ownProps.moduleName,
			onOptionChange: ownProps.onOptionChange,
		};
	} )( EmailWelcomeMessageSetting )
);
