/**
 * Determine if the site has a caching plugin that conflicts with Boost's Page Cache.
 *
 * @return {boolean} True if the site has a caching plugin that conflicts with Boost's Page Cache, false otherwise.
 */
export const hasConflictingCache = (): boolean => {
	return Jetpack_Boost.site.hasCache;
};
