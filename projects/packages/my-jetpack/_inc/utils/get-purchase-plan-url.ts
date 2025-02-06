import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	MY_JETPACK_MY_PLANS_PURCHASE_SOURCE,
	MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE,
} from '../constants';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Return the redurect URL for purchasing a plan, according to the Jetpack redurects source.
 *
 * @return {string}            the redirect URL
 */
const getPurchasePlanUrl = () => {
	const {
		siteSuffix: site = '',
		blogID,
		myJetpackCheckoutUri,
		lifecycleStats,
		siteSuffix,
		adminUrl,
	} = getMyJetpackWindowInitialState();

	const { isSiteConnected, isUserConnected } = lifecycleStats;

	const isConnected = isSiteConnected && isUserConnected;

	// If site or user is not connected, we will send the user to the purchase page without a site in context.
	const redirectID = isConnected
		? MY_JETPACK_MY_PLANS_PURCHASE_SOURCE
		: MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE;

	const getUrlArgs = () => {
		const redirectUri = `redirect_to=${ myJetpackCheckoutUri }`;
		// If the user is not connected, this query will trigger a connection after checkout flow.
		const connectQuery = ! isConnected
			? `&connect_after_checkout=true&from_site_slug=${ siteSuffix }&admin_url=${ adminUrl }&unlinked=1`
			: '';
		const query = `${ redirectUri }${ connectQuery }`;

		if ( ! isConnected ) {
			return {
				query,
			};
		}

		return {
			site: blogID ?? site,
			query,
		};
	};

	return getRedirectUrl( redirectID, getUrlArgs() );
};

export default getPurchasePlanUrl;
