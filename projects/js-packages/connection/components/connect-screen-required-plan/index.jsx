/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from '../connect-button';
import ConnectScreenRequiredPlanVisual from '../connect-screen-required-plan-visual';

/**
 * The Connection Screen component for consumers that require a Plan.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenForRequiredPlan` component.
 */
const ConnectScreenRequiredPlan = props => {
	const {
		title,
		autoTrigger,
		buttonLabel,
		apiRoot,
		apiNonce,
		registrationNonce,
		from,
		redirectUri,
		children,
		connectionStatus,
		priceBefore,
		priceAfter,
		pricingIcon,
		pricingTitle,
		pricingCurrencyCode,
	} = props;

	const renderConnectBtn = useCallback(
		( label, trigger ) => {
			return (
				<ConnectButton
					autoTrigger={ trigger }
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from={ from }
					redirectUri={ redirectUri }
					connectionStatus={ connectionStatus }
					connectLabel={ label }
				/>
			);
		},
		[ apiRoot, apiNonce, registrationNonce, from, redirectUri, connectionStatus ]
	);

	return (
		<ConnectScreenRequiredPlanVisual
			title={ title }
			autoTrigger={ autoTrigger }
			buttonLabel={ buttonLabel }
			priceBefore={ priceBefore }
			priceAfter={ priceAfter }
			pricingIcon={ pricingIcon }
			pricingTitle={ pricingTitle }
			pricingCurrencyCode={ pricingCurrencyCode }
			connectionStatus={ connectionStatus }
			renderConnectBtn={ renderConnectBtn }
		>
			{ children }
		</ConnectScreenRequiredPlanVisual>
	);
};

ConnectScreenRequiredPlan.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** API root. */
	apiRoot: PropTypes.string.isRequired,
	/** API nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** Registration nonce. */
	registrationNonce: PropTypes.string.isRequired,
	/** Where the connection request is coming from. */
	from: PropTypes.string,
	/** The redirect admin URI. */
	redirectUri: PropTypes.string.isRequired,
	/** Connection Status object */
	connectionStatus: PropTypes.object.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** The Pricing Card Title. */
	pricingTitle: PropTypes.string.isRequired,
	/** The Pricing Card Icon. */
	icon: PropTypes.string,
	/** Price before discount. */
	priceBefore: PropTypes.number.isRequired,
	/** Price after discount. */
	priceAfter: PropTypes.number.isRequired,
	/** The Currency code, eg 'USD'. */
	pricingCurrencyCode: PropTypes.string,
};

ConnectScreenRequiredPlan.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	pricingCurrencyCode: 'USD',
	autoTrigger: false,
};

export default ConnectScreenRequiredPlan;
