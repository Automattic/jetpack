import { UpsellBanner, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getSiteData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';

const Upsell = () => {
	const siteSuffix = getSiteData()?.suffix ?? '';
	const checkoutUrl = siteSuffix
		? getProductCheckoutUrl( 'premium', siteSuffix, window.location.href, true )
		: 'https://wordpress.com/pricing';

	return (
		<UpsellBanner
			title={ __( 'Manage episodes with a Premium plan', 'jetpack-podcast' ) }
			description={ __(
				'Upgrade to Premium to see every episode, track plays and durations, and manage your catalog from one place.',
				'jetpack-podcast'
			) }
			primaryCtaLabel={ __( 'Upgrade to Premium', 'jetpack-podcast' ) }
			primaryCtaURL={ checkoutUrl }
		/>
	);
};

export default Upsell;
