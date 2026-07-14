// Shared upsell helpers for the podcast dashboard. `getProductCheckoutUrl` is
// the canonical Calypso checkout-URL builder, so it stays the one place the URL
// format lives; callers only vary the return target, extra params, and the
// no-site-slug fallback.

import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';

// Self-hosted upsells Growth, WordPress.com Premium; the server injects the
// matching slug + plan name (see Admin_Page::inject_podcast_script_data). The
// `'premium'` / `'Premium'` fallbacks reproduce today's Premium/WordPress.com
// behavior for an old bundle running against PHP that doesn't yet inject
// `upgrade`.
export const getUpgradeProductSlug = (): string =>
	getScriptData()?.podcast?.upgrade?.product_slug ?? 'premium';

export const getUpgradePlanName = (): string =>
	getScriptData()?.podcast?.upgrade?.plan_name ?? 'Premium';

interface UpgradeCheckoutUrlArgs {
	/** Calypso site fragment (`site.suffix`); empty falls back to `noSiteSlugUrl`. */
	siteSlug: string;
	/** Where checkout returns after purchase (`redirect_to`). */
	returnUrl: string;
	/** Extra query params to set on the checkout URL (e.g. `source`, `cancel_to`). */
	params?: Record< string, string >;
	/** URL to use when there's no site slug to build a per-site checkout from. */
	noSiteSlugUrl: string;
}

/**
 * Build the podcast upsell checkout URL for the injected upgrade product.
 *
 * @param {UpgradeCheckoutUrlArgs} args               - Checkout URL arguments.
 * @param {string}                 args.siteSlug      - Calypso site fragment; empty falls back to `noSiteSlugUrl`.
 * @param {string}                 args.returnUrl     - Where checkout returns after purchase (`redirect_to`).
 * @param {object}                 [args.params]      - Extra query params to set on the checkout URL.
 * @param {string}                 args.noSiteSlugUrl - URL to use when there's no site slug.
 * @return {string} The checkout URL for the injected upgrade product.
 */
export const buildUpgradeCheckoutUrl = ( {
	siteSlug,
	returnUrl,
	params,
	noSiteSlugUrl,
}: UpgradeCheckoutUrlArgs ): string => {
	if ( ! siteSlug ) {
		return noSiteSlugUrl;
	}

	const url = new URL(
		getProductCheckoutUrl( getUpgradeProductSlug(), siteSlug, returnUrl, true )
	);
	if ( params ) {
		for ( const [ key, value ] of Object.entries( params ) ) {
			url.searchParams.set( key, value );
		}
	}
	return url.toString();
};
