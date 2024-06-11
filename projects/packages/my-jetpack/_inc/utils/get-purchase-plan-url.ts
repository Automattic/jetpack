import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	MY_JETPACK_MY_PLANS_PURCHASE_SOURCE,
	MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE,
} from '../constants';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Return the redurect URL for purchasing a plan, according to the Jetpack redurects source.
 *
 * @returns {string}            the redirect URL
 */
const getPurchasePlanUrl = () => {
	const {
		siteSuffix: site = '',
		blogID,
		myJetpackCheckoutUri,
		lifecycleStats,
	} = getMyJetpackWindowInitialState();

	const { isSiteConnected, isUserConnected } = lifecycleStats;

	// If site or user is not connected, we will send the user to the purchase page without a site in context.
	const redirectID =
		isSiteConnected && isUserConnected
			? MY_JETPACK_MY_PLANS_PURCHASE_SOURCE
			: MY_JETPACK_MY_PLANS_PURCHASE_NO_SITE_SOURCE;

	const getUrlArgs = () => {
		const query = myJetpackCheckoutUri ? `redirect_to=${ myJetpackCheckoutUri }` : null;
		if ( ! isSiteConnected || ! isUserConnected ) {
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
