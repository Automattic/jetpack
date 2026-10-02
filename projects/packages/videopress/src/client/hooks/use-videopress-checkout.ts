// The connection barrel imports image assets unsupported by wp-build.
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { getAdminUrl, getSiteData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';
import { useState } from 'react';

/**
 * Route WordPress.com upgrades to Business and other sites to VideoPress checkout.
 *
 * @param props - Checkout options for the current dashboard.
 * @return The checkout workflow and its redirect state.
 */
export default function useVideoPressCheckout(
	props: NonNullable< Parameters< typeof useProductCheckoutWorkflow >[ 0 ] >
) {
	const checkout = useProductCheckoutWorkflow( props );
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const run: typeof checkout.run = ( event, redirect ) => {
		if ( ! isWpcomPlatformSite() ) {
			return checkout.run( event, redirect );
		}

		event?.preventDefault();
		setIsRedirecting( true );

		const siteSuffix = props.siteSuffix || getSiteData()?.suffix;
		const plansUrl = siteSuffix
			? `https://wordpress.com/plans/${ siteSuffix }`
			: 'https://wordpress.com/plans';

		window.location.href = addQueryArgs( plansUrl, {
			plan: 'business-bundle',
			feature: 'videopress',
			redirect_to: new URL( redirect || props.redirectUrl, getAdminUrl() ).href,
		} );
	};

	return {
		...checkout,
		run,
		hasCheckoutStarted: isRedirecting || checkout.hasCheckoutStarted,
	};
}
