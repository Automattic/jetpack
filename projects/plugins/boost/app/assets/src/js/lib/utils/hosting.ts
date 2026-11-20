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

/**
 * Determine if this site runs on the Atomic platform, as WordPress.com or as a WP Cloud client.
 *
 * @return {boolean} True if the site is on the Atomic platform, false otherwise.
 */
export const isAtomicPlatform = (): boolean => {
	return isWoaHosting() || isWpCloudClient();
};
