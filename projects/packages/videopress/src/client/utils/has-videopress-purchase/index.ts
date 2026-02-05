import { siteHasFeature, isWpcomPlatformSite } from '@automattic/jetpack-script-data';

/**
 * Check if the site has a VideoPress purchase.
 *
 * On Jetpack sites, checks for 'videopress-1tb-storage' feature.
 * On WordPress.com sites, checks for the 'videopress' feature.
 *
 * @return {boolean} Whether the site has a VideoPress purchase.
 */
export function hasVideoPressPurchase(): boolean {
	return (
		siteHasFeature( 'videopress-1tb-storage' ) ||
		( isWpcomPlatformSite() && siteHasFeature( 'videopress' ) )
	);
}
