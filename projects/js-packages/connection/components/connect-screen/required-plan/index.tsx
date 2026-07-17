import { __ } from '@wordpress/i18n';
import useProductCheckoutWorkflow from '../../../hooks/use-product-checkout-workflow';
import useConnection from '../../use-connection';
import ConnectScreenRequiredPlanVisual from './visual';
import type { Props } from './types';
import type { FC } from 'react';

/**
 * The Connection Screen Visual component for consumers that require a Plan.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The `ConnectScreenForRequiredPlan` component.
 */
const ConnectScreenRequiredPlan: FC< Props > = ( {
	title = __(
		'Over 5 million WordPress sites are faster and more secure',
		'jetpack-connection-js'
	),
	autoTrigger = false,
	buttonLabel = __( 'Set up Jetpack', 'jetpack-connection-js' ),
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
	pricingCurrencyCode = 'USD',
	wpcomProductSlug,
	siteProductAvailabilityHandler,
	logo,
	rna = false,
} ) => {
	const {
		handleRegisterSite,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
		isOfflineMode,
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
			displayButtonError={ displayButtonError }
			buttonIsLoading={ buttonIsLoading }
			logo={ logo }
			isOfflineMode={ isOfflineMode }
			rna={ rna }
		>
			{ children }
		</ConnectScreenRequiredPlanVisual>
	);
};

export default ConnectScreenRequiredPlan;
