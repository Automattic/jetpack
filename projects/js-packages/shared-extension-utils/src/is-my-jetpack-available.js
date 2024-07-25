import getJetpackData from './get-jetpack-data';

/**
 * Return whether My Jetpack is available or not while in editor context.
 *
 * @see https://github.com/Automattic/jetpack/pull/38500 introduced the is_my_jetpack_available flag
 * The value is the same that can be found on Initial_State.siteData.showMyJetpack (dashboard context)
 *
 * @returns {boolean} Object indicating if My Jetpack is available (so to navigate to interstitials and product pages)
 */
export default function isMyJetpackAvailable() {
	return getJetpackData()?.jetpack?.is_my_jetpack_available === true;
}
