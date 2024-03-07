// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { MY_JETPACK_MY_PLANS_PURCHASE_SOURCE } from '../constants';
import getMyJetpackWindowState from '../data/utils/get-my-jetpack-window-state';
/**
 * Return the redurect URL for purchasing a plan, according to the Jetpack redurects source.
 *
 * @returns {string}            the redirect URL
 */
export default function () {
	const site = getMyJetpackWindowState( 'siteSuffix', '' );
	const blogID = getMyJetpackWindowState( 'blogID', '' );
	const myJetpackCheckoutUri = getMyJetpackWindowState( 'myJetpackCheckoutUri', '' );

	const query = myJetpackCheckoutUri ? `redirect_to=${ myJetpackCheckoutUri }` : null;
	return getRedirectUrl( MY_JETPACK_MY_PLANS_PURCHASE_SOURCE, { site: blogID ?? site, query } );
}
