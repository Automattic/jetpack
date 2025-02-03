import { getScriptData, siteHasFeature } from '@automattic/jetpack-script-data';
import { SocialScriptData } from '../types';

/**
 * Get the social script data from the window object.
 *
 * @return {SocialScriptData} The social script data.
 */
export function getSocialScriptData(): SocialScriptData {
	return getScriptData()?.social;
}

/**
 * Check if the site has social paid features.
 *
 * @return {boolean} Whether the site has social paid features.
 */
export function hasSocialPaidFeatures() {
	return siteHasFeature( 'social-enhanced-publishing' );
}

/**
 * Check if the site host is wpcom.
 *
 * @return {boolean} Whether the site host is wpcom.
 */
export function isWpcomSite() {
	return getScriptData().site.host === 'wpcom';
}

/**
 * Check if the site host is woa.
 *
 * @return {boolean} Whether the site host is woa.
 */
export function isAtomicSite() {
	return getScriptData().site.host === 'atomic';
}

/**
 * Check if the site is a simple site.
 *
 * @return {boolean} Whether the site is a simple site.
 */
export function isSimpleSite() {
	return isWpcomSite() && ! isAtomicSite();
}
