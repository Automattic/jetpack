import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';

export type DocKey =
	| 'payments'
	| 'donations'
	| 'premiumContent'
	| 'paidNewsletter'
	| 'paypal'
	| 'ads'
	| 'adsUsPrivacy'
	| 'adsGdpr'
	| 'adsTxt';

// jetpack.com/redirect sources for each feature's doc on each kind of host, or a full URL where there's no source.
const DOCS: Record< DocKey, { jetpack: string; wpcom: string } > = {
	payments: {
		jetpack: 'jetpack-support-jetpack-blocks-payments-block',
		wpcom: 'wpcom-payments-donations',
	},
	donations: {
		jetpack: 'jetpack-support-jetpack-blocks-donations-block',
		wpcom: 'wpcom-payments-donations',
	},
	premiumContent: {
		jetpack: 'jetpack-support-jetpack-blocks-paid-content-block',
		wpcom: 'wpcom-support-wordpress-editor-blocks-premium-content-block',
	},
	paidNewsletter: {
		jetpack: 'jetpack-support-paid-newsletter',
		wpcom: 'paid-newsletter-info',
	},
	paypal: {
		jetpack: 'jetpack-support-pay-with-paypal',
		wpcom: 'wpcom-support-wordpress-editor-blocks-pay-with-paypal',
	},
	ads: {
		jetpack: 'jetpack-support-ads',
		wpcom: 'wpcom-support-wordads-and-earn',
	},
	adsUsPrivacy: {
		jetpack: 'jetpack-support-ads',
		wpcom: 'wpcom-support-us-privacy',
	},
	adsGdpr: {
		jetpack: 'jetpack-support-ads',
		wpcom:
			'https://wordpress.com/support/wordads-and-earn/configure-ad-settings/#consent-management',
	},
	adsTxt: {
		jetpack: 'jetpack-support-ads',
		wpcom: 'https://wordpress.com/support/manage-your-ads-txt-file/',
	},
};

/**
 * A feature's support doc: WordPress.com's on WoA and Simple, Jetpack's elsewhere.
 *
 * @param key - The feature.
 * @return The doc's URL, through jetpack.com/redirect unless it's a full URL.
 */
export function getDocUrl( key: DocKey ): string {
	const doc = DOCS[ key ][ isWpcomPlatformSite() ? 'wpcom' : 'jetpack' ];
	// The redirect would drop a full URL's anchor.
	return doc.startsWith( 'https://' ) ? doc : getRedirectUrl( doc );
}
