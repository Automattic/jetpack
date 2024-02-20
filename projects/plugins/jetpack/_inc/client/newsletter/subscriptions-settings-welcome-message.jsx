import { __ } from '@wordpress/i18n';
import { FormLabel } from 'components/forms';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback } from 'react';
import Textarea from '../components/textarea';

const SubscriptionSettingsWelcomeMessage = props => {
	const { getOptionValue, isSavingAnyOption, module, onOptionChange } = props;

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
			module="subscriptions"
			saveDisabled={ isSavingAnyOption( [ 'subscription_options' ] ) }
		>
			<SettingsGroup hasChild disableInOfflineMode module={ module }>
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

export { SubscriptionSettingsWelcomeMessage as default };
