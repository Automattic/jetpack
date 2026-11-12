import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';

export type DocKey =
	'payments' | 'donations' | 'premiumContent' | 'paidNewsletter' | 'paypal' | 'ads';

// A redirect source where one points at the right page, the page's own URL where none does.
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
		jetpack: 'https://jetpack.com/support/jetpack-blocks/paid-content-block/',
		wpcom: 'wpcom-support-wordpress-editor-blocks-premium-content-block',
	},
	paidNewsletter: {
		jetpack: 'https://jetpack.com/support/newsletter/paid-newsletters/',
		wpcom: 'https://wordpress.com/support/paid-newsletters/',
	},
	paypal: {
		jetpack: 'jetpack-support-pay-with-paypal',
		wpcom: 'https://wordpress.com/support/wordpress-editor/blocks/pay-with-paypal/',
	},
	ads: {
		jetpack: 'jetpack-support-ads',
		wpcom: 'https://wordads.co/',
	},
};

/**
 * A feature's support doc: WordPress.com's on WoA and Simple, Jetpack's elsewhere.
 *
 * @param key - The feature.
 * @return The doc's URL, through jetpack.com/redirect.
 */
export function getDocUrl( key: DocKey ): string {
	const doc = DOCS[ key ];
	return getRedirectUrl( isWpcomPlatformSite() ? doc.wpcom : doc.jetpack );
}
