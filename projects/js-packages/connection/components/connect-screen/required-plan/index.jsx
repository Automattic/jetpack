import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import useProductCheckoutWorkflow from '../../../hooks/use-product-checkout-workflow';
import useConnection from '../../use-connection';
import ConnectScreenRequiredPlanVisual from './visual';

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
		wpcomProductSlug,
		siteProductAvailabilityHandler,
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

	const productSlug = wpcomProductSlug ? wpcomProductSlug : '';

	const { run: handleCheckoutWorkflow, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug,
		redirectUrl: redirectUri,
		siteProductAvailabilityHandler,
		from,
	} );

	const showConnectButton = ! isRegistered || ! isUserConnected;
	const displayButtonError = Boolean( registrationError );
	const buttonIsLoading = siteIsRegistering || userIsConnecting || hasCheckoutStarted;
	const handleButtonClick = productSlug ? handleCheckoutWorkflow : handleRegisterSite;

	return (
		<ConnectScreenRequiredPlanVisual
			title={ title }
			buttonLabel={ buttonLabel }
			priceBefore={ priceBefore }
			priceAfter={ priceAfter }
			pricingIcon={ pricingIcon }
			pricingTitle={ pricingTitle }
			pricingCurrencyCode={ pricingCurrencyCode }
			handleButtonClick={ handleButtonClick }
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
	/** The WordPress.com product slug. If specified, the connection/authorization flow will go through the Checkout page for this product'. */
	wpcomProductSlug: PropTypes.string,
	/** A callback that will be used to check whether the site already has the wpcomProductSlug. This will be checked after registration and the checkout will be skipped if it returns true. */
	checkSiteHasWpcomProduct: PropTypes.func,
};

ConnectScreenRequiredPlan.defaultProps = {
	title: __( 'Over 5 million WordPress sites are faster and more secure', 'jetpack' ),
	buttonLabel: __( 'Set up Jetpack', 'jetpack' ),
	pricingCurrencyCode: 'USD',
	autoTrigger: false,
};

export default ConnectScreenRequiredPlan;
