import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getJetpackCloudUrl } from 'state/initial-state';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

/**
 * Paid Newsletter component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Subscription settings component.
 */
function PaidNewsletter( props ) {
	const { isSubscriptionsActive, setupPaymentPlansUrl } = props;

	const setupPaymentPlansButtonDisabled = ! isSubscriptionsActive;

	const trackSetupPaymentPlansButtonClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( 'newsletter_settings_setup_payment_plans_button_click' );
	}, [] );

	return (
		<SettingsCard header={ __( 'Paid Newsletter', 'jetpack' ) } hideButton>
			<SettingsGroup>
				<p className="jp-settings-card__email-settings">
					{ __(
						'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
						'jetpack'
					) }
				</p>

				<Button
					href={ ! setupPaymentPlansButtonDisabled ? setupPaymentPlansUrl : undefined }
					onClick={ trackSetupPaymentPlansButtonClick }
					disabled={ setupPaymentPlansButtonDisabled }
					primary
					rna
				>
					{ __( 'Set up', 'jetpack' ) }
				</Button>
			</SettingsGroup>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isSubscriptionsActive: ownProps.getOptionValue( SUBSCRIPTIONS_MODULE_NAME ),
			setupPaymentPlansUrl: getJetpackCloudUrl( state, 'monetize/payments' ),
		};
	} )( PaidNewsletter )
);
