import getJetpackData from './get-jetpack-data';

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
