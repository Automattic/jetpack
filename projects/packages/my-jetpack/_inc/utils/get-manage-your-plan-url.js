// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { MY_JETPACK_MY_PLANS_MANAGE_SOURCE } from '../constants';

/**
 * Return the redurect URL, according to the Jetpack redurects source.
 *
 * @returns {string} the redirect URL
 */
export default function () {
	const { siteSuffix: site } = window?.myJetpackInitialState;
	return getRedirectUrl( MY_JETPACK_MY_PLANS_MANAGE_SOURCE, { site } );
}
