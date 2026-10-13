import { getProductCheckoutUrl } from '@automattic/jetpack-components';

/**
 * Where the reader lands to buy a storage add-on for this site.
 *
 * A wrapper around `@automattic/jetpack-components`, holding only the two decisions
 * that are ours rather than that helper's.
 *
 * The site slug has no fallback, and callers must not render a link without one: the
 * helper interpolates whatever it is given, so an unknown slug produces
 * `…/checkout/undefined/<product>`. Requiring a `string` here makes the caller decide.
 *
 * `redirect_to` is the page the reader is standing on rather than a rebuilt
 * `admin.php?page=jetpack-backup`, which the modernized page emits no URL for. It is the
 * same destination by construction, and absolute, which `redirect_to` requires.
 *
 * @param productSlug - The WordPress.com product slug to buy.
 * @param siteSuffix  - The site's Calypso slug, e.g. `example.wordpress.com`.
 * @return The Calypso checkout URL.
 */
export function storageAddonCheckoutUrl( productSlug: string, siteSuffix: string ): string {
	return getProductCheckoutUrl( productSlug, siteSuffix, window.location.href, true );
}

/** Query args that carry a retention choice through checkout and back. */
export const RETENTION_ARG = 'retention';
export const STORAGE_PURCHASED_ARG = 'storage_purchased';

/**
 * Checkout for the storage a retention choice needs, returning here with that choice.
 *
 * Mirrors Jetpack Cloud's retention purchase, `source` included: without it the cart
 * renews an add-on the site already has instead of adding another.
 *
 * @param productSlug - The WordPress.com product slug to buy.
 * @param siteSuffix  - The site's Calypso slug.
 * @param days        - The retention the purchase is for.
 * @return The Calypso checkout URL.
 */
export function retentionCheckoutUrl(
	productSlug: string,
	siteSuffix: string,
	days: number
): string {
	const here = new URL( window.location.href );
	here.searchParams.delete( STORAGE_PURCHASED_ARG );
	here.searchParams.set( RETENTION_ARG, String( days ) );
	const backUrl = here.toString();
	here.searchParams.set( STORAGE_PURCHASED_ARG, '1' );

	const checkout = new URL(
		getProductCheckoutUrl( productSlug, siteSuffix, here.toString(), true )
	);
	checkout.searchParams.set( 'source', 'backup-storage-purchase-not-renewal' );
	checkout.searchParams.set( 'checkoutBackUrl', backUrl );

	return checkout.toString();
}
