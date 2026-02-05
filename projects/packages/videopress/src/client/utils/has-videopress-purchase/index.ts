import { siteHasFeature, isWpcomPlatformSite } from '@automattic/jetpack-script-data';

/**
 * Check if the site has a VideoPress purchase (1TB or unlimited).
 *
 * On Jetpack sites, checks for the 'videopress-1tb-storage' feature.
 * On WordPress.com sites, also checks for the 'videopress' feature
 * which is equivalent to 1TB storage.
 *
 * @return {boolean} Whether the site has a VideoPress purchase.
 */
export function hasVideoPressPurchase(): boolean {
	return (
		siteHasFeature( 'videopress-1tb-storage' ) ||
		( isWpcomPlatformSite() && siteHasFeature( 'videopress' ) )
	);
}
