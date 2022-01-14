/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectScreenRequiredPlanVisual from './visual';
import { STORE_ID } from '../../../state/store';
import useConnection from '../../use-connection';

/**
 * The Connection Screen Visual component for consumers that require a Plan.
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
		priceBefore,
		priceAfter,
		pricingIcon,
		pricingTitle,
		pricingCurrencyCode,
	} = props;

	const {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
	} = useConnection( {
		registrationNonce,
		redirectUri,
		apiRoot,
		apiNonce,
		autoTrigger,
		from,
	} );

	const showConnectButton = ! isRegistered || ! isUserConnected;
	const connectionStatusIsFetching = useSelect( select =>
		select( STORE_ID ).getConnectionStatusIsFetching()
	);
	const displayButtonError = Boolean( registrationError );
	const buttonIsLoading = siteIsRegistering || userIsConnecting;

	return (
		<ConnectScreenRequiredPlanVisual
			title={ title }
			buttonLabel={ buttonLabel }
			priceBefore={ priceBefore }
			priceAfter={ priceAfter }
			pricingIcon={ pricingIcon }
			pricingTitle={ pricingTitle }
			pricingCurrencyCode={ pricingCurrencyCode }
			isLoading={ connectionStatusIsFetching }
			handleButtonClick={ handleRegisterSite }
			showConnectButton={ showConnectButton }
			displayButtonError={ displayButtonError }
			buttonIsLoading={ buttonIsLoading }
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
