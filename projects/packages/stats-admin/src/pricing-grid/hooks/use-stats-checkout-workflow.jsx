import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';

const { siteSuffix: defaultSiteSuffix } = window?.JP_CONNECTION_INITIAL_STATE || {};

/**
 * Custom hook that handles the Stats checkout workflow.
 * Wraps the generic useProductCheckoutWorkflow hook to provide sensible defaults for Stats.
 *
 * @param {object}   props                       - Hook properties.
 * @param {string}   props.productSlug           - The product slug to checkout.
 * @param {string}   props.redirectUrl           - Where to redirect after checkout.
 * @param {string}   [props.siteSuffix]          - The site suffix/domain.
 * @param {string}   [props.adminUrl]            - The wp-admin URL.
 * @param {Function} [props.availabilityHandler] - Handler to check product availability.
 * @return {object} The checkout workflow object with a run() method.
 */
export default function useStatsCheckoutWorkflow( {
	productSlug,
	redirectUrl = 'admin.php?page=stats',
	siteSuffix = defaultSiteSuffix,
	adminUrl = window?.JP_CONNECTION_INITIAL_STATE?.adminUrl || '/wp-admin/',
	availabilityHandler = null,
} = {} ) {
	const { isRegistered, isUserConnected } = useConnection( {
		from: 'jetpack-stats-pricing-grid',
		redirectUri: redirectUrl,
	} );

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug,
		redirectUrl,
		siteSuffix,
		adminUrl,
		connectAfterCheckout: ! isRegistered || ! isUserConnected,
		siteProductAvailabilityHandler: availabilityHandler,
		from: 'jetpack-stats-pricing-grid',
		useBlogIdSuffix: !! window?.JP_CONNECTION_INITIAL_STATE?.blogId,
	} );

	return {
		run,
		hasCheckoutStarted,
		isRegistered,
		isUserConnected,
	};
}
