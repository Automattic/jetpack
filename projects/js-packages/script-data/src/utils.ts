/**
 * Get the script data from the window object.
 *
 * @return {import('./types').JetpackScriptData} The script data.
 */
export function getScriptData() {
	return window.JetpackScriptData;
}

/**
 * Get the site data from the script data.
 *
 * @return {import('./types').SiteData} The site data.
 */
export function getSiteData() {
	return getScriptData().site;
}

/**
 * Get the admin URL from the script data.
 *
 * @param {string} [path] - The path to append to the admin URL. e.g. `admin.php?page=jetpack`.
 *
 * @return {string} The admin URL.
 */
export function getAdminUrl( path = '' ) {
	return `${ getScriptData().site.admin_url }${ path }`;
}

/**
 * Get the url for the Jetpack admin page.
 *
 * @param {string} [section] - The section to append to the My Jetpack URL. e.g. `#/settings`.
 *
 * @return {string} The Jetpack admin page URL.
 */
export function getJetpackAdminPageUrl( section = '' ) {
	return getAdminUrl( `admin.php?page=jetpack${ section }` );
}

/**
 * Get the url for the My Jetpack page.
 *
 * @param {string} [section] - The section to append to the My Jetpack URL. e.g. `#/connection`.
 *
 * @return {string} The My Jetpack URL.
 */
export function getMyJetpackUrl( section = '' ) {
	return getAdminUrl( `admin.php?page=my-jetpack${ section }` );
}

/**
 * Get active features from the site plan.
 *
 * @return {import('./types').SitePlan['features']['active']} The active features.
 */
export function getActiveFeatures() {
	return getScriptData().site.plan?.features?.active ?? [];
}

/**
 * Check if the site has a specific feature.
 *
 * @param {string} feature - The feature to check. e.g. "republicize".
 *
 * @return {boolean} Whether the site has the feature.
 */
export function siteHasFeature( feature: string ) {
	return getActiveFeatures().includes( feature );
}

/**
 * Check if the site host is wpcom.
 *
 * @return {boolean} Whether the site host is wpcom.
 */
export function isSimpleSite() {
	return getScriptData().site?.host === 'wpcom';
}

/**
 * Check if the is an Atomic site.
 *
 * @return {boolean} Whether the site is an Atomic site.
 */
export function isAtomicSite() {
	return getScriptData().site?.host === 'atomic';
}

/**
 * Check if the site is a WoA site
 *
 * @return Whether the site is woa.
 */
export function isWoASite() {
	return getScriptData().site?.host === 'woa';
}

/**
 * Determine if this is a WordPress.com site.
 *
 * Includes both Simple and WoA platforms.
 *
 * @return Whether the site is a WordPress.com site.
 */
export function isWpcomPlatformSite() {
	return isSimpleSite() || isWoASite();
}

/**
 * Check if the site is self-hosted Jetpack site.
 *
 * @return {boolean} Whether the site is self-hosted Jetpack site.
 */
export function isJetpackSelfHostedSite() {
	return getScriptData()?.site?.host === 'unknown';
}
