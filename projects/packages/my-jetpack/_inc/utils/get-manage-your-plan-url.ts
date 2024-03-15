import { getRedirectUrl } from '@automattic/jetpack-components';
import { MY_JETPACK_MY_PLANS_MANAGE_SOURCE } from '../constants';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Return the redurect URL, according to the Jetpack redurects source.
 *
 * @returns {string}            the redirect URL
 */
const getManageYourPlanUrl = () => {
	const { siteSuffix: site = '', blogID } = getMyJetpackWindowInitialState();

	return getRedirectUrl( MY_JETPACK_MY_PLANS_MANAGE_SOURCE, { site: blogID ?? site } );
};

export default getManageYourPlanUrl;
