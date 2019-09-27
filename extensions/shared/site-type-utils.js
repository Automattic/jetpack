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
