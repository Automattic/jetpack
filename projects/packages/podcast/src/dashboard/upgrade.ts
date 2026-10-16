import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getScriptData, getSiteData } from '@automattic/jetpack-script-data';

export const getUpgradeProductSlug = (): string =>
	getScriptData()?.podcast?.upgrade?.product_slug ?? 'premium';

export const getUpgradePlanName = (): string =>
	getScriptData()?.podcast?.upgrade?.plan_name ?? 'Premium';

const getUpgradeProductCheckoutUrl = (): string =>
	`https://wordpress.com/checkout/${ getUpgradeProductSlug() }`;

const getSiteSlug = (): string => getSiteData()?.suffix ?? '';

const getUpgradeSiteFragment = (): string => {
	const blogId = getSiteData()?.wpcom?.blog_id;

	return blogId ? String( blogId ) : getSiteSlug();
};

interface UpgradeCheckoutUrlArgs {
	returnUrl: string;
	params?: Record< string, string >;
}

/**
 * Build the podcast upsell checkout URL for the injected upgrade product.
 *
 * @param {UpgradeCheckoutUrlArgs} args           - Checkout URL arguments.
 * @param {string}                 args.returnUrl - Where checkout returns after purchase (`redirect_to`).
 * @param {object}                 [args.params]  - Extra query params to set on the checkout URL.
 * @return {string} The checkout URL for the injected upgrade product.
 */
export const buildUpgradeCheckoutUrl = ( {
	returnUrl,
	params,
}: UpgradeCheckoutUrlArgs ): string => {
	const siteFragment = getUpgradeSiteFragment();

	if ( ! siteFragment ) {
		return getUpgradeProductCheckoutUrl();
	}

	const url = new URL(
		getProductCheckoutUrl( getUpgradeProductSlug(), siteFragment, returnUrl, true )
	);

	// `getProductCheckoutUrl` derives `site` from the path fragment; Boost and
	// `useProductCheckoutWorkflow` keep the slug there and take the blog ID for
	// the path alone, so match that shape.
	const slug = getSiteSlug();
	if ( slug ) {
		url.searchParams.set( 'site', slug );
	}

	if ( params ) {
		for ( const [ key, value ] of Object.entries( params ) ) {
			url.searchParams.set( key, value );
		}
	}
	return url.toString();
};
