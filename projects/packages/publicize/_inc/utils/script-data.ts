import { getAdminUrl, getScriptData, siteHasFeature } from '@automattic/jetpack-script-data';
import { SocialScriptData } from '../types';
import { features } from './constants';

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
 * @return Whether the site has social paid features.
 */
export function hasSocialPaidFeatures() {
	return siteHasFeature( features.ENHANCED_PUBLISHING );
}

/**
 * Get the url for the Social admin page.
 *
 * @return The Social admin page URL.
 */
export function getSocialAdminPageUrl() {
	return getAdminUrl( 'admin.php?page=jetpack-social' );
}

/**
 * Get the redirect query for refreshing plan data after purchase.
 *
 * @return The redirect query string including nonce when available.
 */
export function getRefreshPlanQuery() {
	const nonce = getSocialScriptData().nonces?.refresh_plan;
	const baseQuery = 'redirect_to=admin.php?page=jetpack-social&refresh_plan_data=1';

	if ( ! nonce ) {
		return baseQuery;
	}

	return `${ baseQuery }&_wpnonce=${ encodeURIComponent( nonce ) }`;
}
