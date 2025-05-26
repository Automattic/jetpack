import getJetpackData from './get-jetpack-data';

/**
 * Get the site type from environment
 *
 * @return {(string|null)} Site type
 */
function getSiteType() {
	return 'object' === typeof window && typeof window._currentSiteType === 'string'
		? window._currentSiteType
		: null;
}

/**
 * Check if environment is Simple site.
 *
 * @return {boolean} True for Simple sites.
 */
export function isSimpleSite() {
	return getSiteType() === 'simple';
}

/**
 * Check if environment is Atomic site.
 *
 * @return {boolean} True for Atomic sites.
 */
export function isAtomicSite() {
	return getSiteType() === 'atomic';
}

/**
 * Check if environment is a WoA site.
 * Replacement function for isAtomicSite.
 *
 * @return {boolean} True for WoA sites.
 */
export function isWoASite() {
	return getSiteType() === 'atomic';
}

/**
 * Return whether the current blog is set to private. (if blog_public option is -1)
 *
 * @return {boolean} whether the current blog is set to private.
 */
export function isPrivateSite() {
	const jetpackData = getJetpackData();
	return jetpackData?.jetpack?.is_private_site ?? false;
}

/**
 * Return whether the current site is coming soon (i.e. not launched yet).
 * This is only available for WordPress.com sites so far.
 *
 * @return {boolean} whether the current site is coming soon.
 */
export function isComingSoon() {
	const jetpackData = getJetpackData();
	return jetpackData?.jetpack?.is_coming_soon ?? false;
}
