import { getAdminUrl, getScriptData, siteHasFeature } from '@automattic/jetpack-script-data';
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
 * Get the url for the Social admin page.
 *
 * @return The Social admin page URL.
 */
export function getSocialAdminPageUrl() {
	return getAdminUrl( 'admin.php?page=jetpack-social' );
}
