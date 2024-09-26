import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { isUnavailableInSiteConnectionMode, isOfflineMode } from 'state/connection';
import { getJetpackCloudUrl } from 'state/initial-state';
import { getModule } from 'state/modules';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

/**
 * Paid Newsletter component.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Paid Newsletter component.
 */
function PaidNewsletter( props ) {
	const {
		isSubscriptionsActive,
		setupPaymentPlansUrl,
		subscriptionsModule,
		unavailableInSiteConnectionMode,
	} = props;

	const setupPaymentPlansButtonDisabled =
		! isSubscriptionsActive || unavailableInSiteConnectionMode;

	const trackSetupPaymentPlansButtonClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( 'newsletter_settings_setup_payment_plans_button_click' );
	}, [] );

	return (
		<SettingsCard { ...props } header={ __( 'Paid Newsletter', 'jetpack' ) } hideButton>
			<SettingsGroup
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
			>
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
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isOffline: isOfflineMode( state ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( PaidNewsletter )
);
