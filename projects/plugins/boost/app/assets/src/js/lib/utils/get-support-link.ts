import { usePremiumFeatures } from '$lib/stores/premium-features';

export default function getSupportLink() {
	const premiumFeatures = usePremiumFeatures();
	if ( premiumFeatures.includes( 'support' ) ) {
		return 'https://jetpack.com/contact-support/';
	}

	return 'https://wordpress.org/support/plugin/jetpack-boost/';
}
