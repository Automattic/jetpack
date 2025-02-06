/**
 * Determine if this site is on a WP Cloud client.
 *
 * @return {boolean} True if the site is on a WP Cloud client, false otherwise.
 */
export const isWpCloudClient = (): boolean => {
	return Jetpack_Boost.site.host === 'atomic';
};

/**
 * Determine if this site is an WordPress.com on Atomic site.
 *
 * @return {boolean} True if the site is an WordPress.com on Atomic site, false otherwise.
 */
export const isWoaHosting = (): boolean => {
	return Jetpack_Boost.site.host === 'woa';
};
