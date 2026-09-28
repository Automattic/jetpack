import {
	getAdminUrl,
	getScriptData,
	isSimpleSite,
	siteHasFeature,
} from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';
import { SocialScriptData, SocialUpgrade } from '../types';
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
 * Whether the redesigned admin UI (v2) is enabled — gates the new
 * add-account connection flow behind the `ADMIN_UI_V2` feature.
 *
 * @return Whether the v2 admin UI is enabled.
 */
export function hasAdminUiV2() {
	return siteHasFeature( features.ADMIN_UI_V2 );
}

/**
 * Read the upgrade payload the server attaches for Simple sites.
 *
 * @return The upgrade details, or null when the site has no such upgrade path.
 */
function getSocialUpgrade(): SocialUpgrade | null {
	return getSocialScriptData()?.upgrade ?? null;
}

/**
 * Get the short name of the plan that unlocks Social's paid features.
 *
 * @return The plan name, or null when it isn't known.
 */
export function getUpgradePlanName(): string | null {
	return getSocialUpgrade()?.plan_name ?? null;
}

/**
 * Build the upgrade URL for a WordPress.com Simple site.
 *
 * WordPress.com checkout rejects the standalone Jetpack Social plan the redirect
 * service points at, so Simple sites go to the plans page instead.
 *
 * @param feature    - Feature slug, tagged onto the URL so the upsell is attributable.
 * @param redirectTo - Absolute URL to return to once the upgrade is done.
 * @return The plans page URL, or null when the site isn't a Simple site.
 */
export function getSimpleSiteUpgradeUrl( feature: string, redirectTo: string ): string | null {
	if ( ! isSimpleSite() ) {
		return null;
	}

	const planSlug = getSocialUpgrade()?.plan_slug;
	// Without a slug the plans page still works, where `plans/undefined` would 404.
	const siteSuffix = getScriptData()?.site?.suffix;
	const plansUrl = siteSuffix
		? `https://wordpress.com/plans/${ siteSuffix }`
		: 'https://wordpress.com/plans';

	return addQueryArgs( plansUrl, {
		// Preselects the plan card; omitted when the slug didn't resolve.
		...( planSlug ? { plan: planSlug } : {} ),
		feature,
		redirect_to: redirectTo,
	} );
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

/**
 * Resolve a runtime URL for a file in the package's `assets/` build directory.
 *
 * Assets in `_inc/assets/` are copied verbatim to `build/assets/` by both the
 * webpack (legacy) and wp-build (chassis) pipelines. Resolving the URL at runtime
 * — instead of `import x from './foo.webp'` — keeps esbuild happy (no binary loader).
 *
 * @param filename - The file name within the assets directory.
 * @return The absolute URL to the asset.
 */
export function assetUrl( filename: string ): string {
	return `${ getSocialScriptData()?.assets_url ?? '' }assets/${ filename }`;
}
