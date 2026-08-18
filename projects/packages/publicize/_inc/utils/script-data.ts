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
 * Get the plan a site needs to buy to unlock Social's paid features.
 *
 * Only WordPress.com Simple sites get this: every other site type is sent to
 * the Jetpack redirect service, which resolves the product on its own.
 *
 * @return The upgrade details, or null when the site has no such upgrade path.
 */
function getSocialUpgrade(): SocialUpgrade | null {
	return getSocialScriptData()?.upgrade ?? null;
}

/**
 * Get the short name ("Business") of the plan that unlocks Social's paid features.
 *
 * @return The plan name, or null when it isn't known. Callers fall back to copy
 * that doesn't name a plan.
 */
export function getUpgradePlanName(): string | null {
	return getSocialUpgrade()?.plan_name ?? null;
}

/**
 * Build the upgrade URL for a WordPress.com Simple site.
 *
 * Simple sites can't buy the standalone Jetpack Social plan — checkout rejects it
 * as incompatible — so they're sent to the WordPress.com plans page for the plan
 * that does unlock the feature. Mirrors how Global Styles upsells Simple sites
 * (`wpcom-global-styles/index.php`).
 *
 * Returns null on every other site type, where the caller keeps using the Jetpack
 * redirect service.
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
	// Without a site slug the plans page still works — it just asks which site
	// first — where `plans/undefined` would 404.
	const siteSuffix = getScriptData()?.site?.suffix;
	const plansUrl = siteSuffix
		? `https://wordpress.com/plans/${ siteSuffix }`
		: 'https://wordpress.com/plans';

	return addQueryArgs( plansUrl, {
		// Preselects the plan card. Omitted when the slug didn't resolve, which
		// still leaves a usable — if less specific — plans page.
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
