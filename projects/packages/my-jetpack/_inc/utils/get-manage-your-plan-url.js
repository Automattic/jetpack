// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { MY_JETPACK_MY_PLANS_MANAGE_SOURCE } from '../constants';

/**
 * Return the redurect URL, according to the Jetpack redurects source.
 *
 * @returns {string}            the redirect URL
 */
export default function () {
	const site = window?.myJetpackInitialState?.siteSuffix;
	return getRedirectUrl( MY_JETPACK_MY_PLANS_MANAGE_SOURCE, { site } );
}
