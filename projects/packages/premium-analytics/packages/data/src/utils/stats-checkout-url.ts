/**
 * External dependencies
 */
import getCalypsoOrigin from '@automattic/jetpack-connection/get-calypso-origin';

const STATS_COMMERCIAL_PRODUCT = 'jetpack_stats_yearly';

type StatsCheckoutUrlOptions = {
	/** The monthly views limit to buy. */
	quantity: number;
	adminUrl: string;
	/** The site address checkout knows the site by, e.g. `example.com`. */
	siteSlug: string;
	blogId: number;
	isUserConnected: boolean;
	/** Whether the site already holds a Stats plan; checkout handles upgrades on the site's own checkout only. */
	isUpgrade: boolean;
	/** Where checkout returns to after a purchase, relative to wp-admin. */
	redirectPath: string;
	/** Where checkout's back link goes, relative to wp-admin. */
	backPath: string;
};

/** The WordPress.com checkout URL for a Stats commercial tier, built the way classic Stats builds it from wp-admin. */
export function getStatsCheckoutUrl( options: StatsCheckoutUrlOptions ): string {
	const {
		quantity,
		adminUrl,
		siteSlug,
		blogId,
		isUserConnected,
		isUpgrade,
		redirectPath,
		backPath,
	} = options;
	const params = new URLSearchParams();
	let checkoutSite: string;

	if ( ! isUserConnected ) {
		checkoutSite = 'jetpack';
		params.set( 'connect_after_checkout', 'true' );
		params.set( 'admin_url', adminUrl );
		params.set( 'from_site_slug', siteSlug );
	} else if ( isUpgrade ) {
		checkoutSite = siteSlug;
	} else {
		checkoutSite = String( blogId );
		params.set( 'site', siteSlug );
		params.set( 'source', 'jetpack_premium_analytics_upsell' );
	}

	const redirectUrl = new URL( redirectPath, adminUrl );
	redirectUrl.searchParams.set( 'statsPurchaseSuccess', 'paid' );
	params.set( 'redirect_to', redirectUrl.toString() );
	params.set( 'checkoutBackUrl', new URL( backPath, adminUrl ).toString() );

	const checkoutUrl = new URL(
		`checkout/${ encodeURIComponent( checkoutSite ) }/${ STATS_COMMERCIAL_PRODUCT }:-q-${ quantity }`,
		getCalypsoOrigin()
	);
	checkoutUrl.search = params.toString();

	return checkoutUrl.toString();
}
