// Shared upsell helpers for the podcast dashboard. `getProductCheckoutUrl` is
// the canonical Calypso checkout-URL builder, so it stays the one place the URL
// format lives; callers only vary the return target, extra params, and the
// no-site fallback.

import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getScriptData, getSiteData } from '@automattic/jetpack-script-data';

// Self-hosted upsells Growth, WordPress.com Premium; the server injects the
// matching slug + plan name (see Admin_Page::inject_podcast_script_data). The
// `'premium'` / `'Premium'` fallbacks reproduce today's Premium/WordPress.com
// behavior for an old bundle running against PHP that doesn't yet inject
// `upgrade`.
export const getUpgradeProductSlug = (): string =>
	getScriptData()?.podcast?.upgrade?.product_slug ?? 'premium';

export const getUpgradePlanName = (): string =>
	getScriptData()?.podcast?.upgrade?.plan_name ?? 'Premium';

// Generic, site-agnostic checkout for the injected upgrade product (e.g.
// `jetpack_growth` on self-hosted, `premium` on wpcom). Used as the fallback
// when the site can't be identified to build a per-site checkout from.
export const getUpgradeProductCheckoutUrl = (): string =>
	`https://wordpress.com/checkout/${ getUpgradeProductSlug() }`;

/**
 * Identify the site to Calypso for checkout.
 *
 * Prefer the WordPress.com blog ID: `site.suffix` is derived from `home_url()`,
 * which doesn't match the site WordPress.com knows whenever the two disagree
 * (WordPress in its own directory, mapped domains, multi-URL setups), and
 * checkout answers "You don't have access to this site". The slug and the
 * admin host are fallbacks for when no blog ID was injected.
 *
 * @return {string} Blog ID, site slug, or admin host; empty when none resolve.
 */
export const getUpgradeSiteFragment = (): string => {
	const site = getSiteData();

	if ( site?.wpcom?.blog_id ) {
		return String( site.wpcom.blog_id );
	}

	if ( site?.suffix ) {
		return site.suffix;
	}

	try {
		return new URL( site?.admin_url ?? '' ).host;
	} catch {
		return '';
	}
};

interface UpgradeCheckoutUrlArgs {
	/** Where checkout returns after purchase (`redirect_to`). */
	returnUrl: string;
	/** Extra query params to set on the checkout URL (e.g. `source`, `cancel_to`). */
	params?: Record< string, string >;
	/** URL to use when the site can't be identified; defaults to the generic product checkout. */
	noSiteUrl?: string;
}

/**
 * Build the podcast upsell checkout URL for the injected upgrade product.
 *
 * @param {UpgradeCheckoutUrlArgs} args             - Checkout URL arguments.
 * @param {string}                 args.returnUrl   - Where checkout returns after purchase (`redirect_to`).
 * @param {object}                 [args.params]    - Extra query params to set on the checkout URL.
 * @param {string}                 [args.noSiteUrl] - URL to use when the site can't be identified; defaults to the generic product checkout.
 * @return {string} The checkout URL for the injected upgrade product.
 */
export const buildUpgradeCheckoutUrl = ( {
	returnUrl,
	params,
	noSiteUrl = getUpgradeProductCheckoutUrl(),
}: UpgradeCheckoutUrlArgs ): string => {
	const siteFragment = getUpgradeSiteFragment();

	if ( ! siteFragment ) {
		return noSiteUrl;
	}

	const url = new URL(
		getProductCheckoutUrl( getUpgradeProductSlug(), siteFragment, returnUrl, true )
	);
	if ( params ) {
		for ( const [ key, value ] of Object.entries( params ) ) {
			url.searchParams.set( key, value );
		}
	}
	return url.toString();
};
