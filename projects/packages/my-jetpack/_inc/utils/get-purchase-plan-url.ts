import { getRedirectUrl } from '@automattic/jetpack-components';
import { MY_JETPACK_MY_PLANS_PURCHASE_SOURCE } from '../constants';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';
/**
 * Return the redurect URL for purchasing a plan, according to the Jetpack redurects source.
 *
 * @returns {string}            the redirect URL
 */
const getPurchasePlanUrl = () => {
	const { siteSuffix: site = '', blogID, myJetpackCheckoutUri } = getMyJetpackWindowInitialState();

	const query = myJetpackCheckoutUri ? `redirect_to=${ myJetpackCheckoutUri }` : null;
	return getRedirectUrl( MY_JETPACK_MY_PLANS_PURCHASE_SOURCE, { site: blogID ?? site, query } );
};

export default getPurchasePlanUrl;
