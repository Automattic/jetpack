import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Banner } from 'components/banner';
import yoastJetpackLogosSvg from './yoast-jetpack-logos.svg';

import '@wordpress/core-data';

const PLUGIN_SLUG_YOAST_FREE = 'wordpress-seo/wp-seo';
const PLUGIN_SLUG_YOAST_PREMIUM = 'wordpress-seo-premium/wp-seo-premium';

const Content = {
	FREE: {
		title: __( 'Boost your organic traffic with Jetpack and Yoast SEO', 'jetpack' ),
		callToAction: __( 'Get Yoast SEO', 'jetpack' ),
		href: 'https://yoa.st/yoast-jetpack-boost',
	},
	PREMIUM: {
		title: __(
			'Boost your organic traffic even more with Jetpack and Yoast SEO Premium',
			'jetpack'
		),
		callToAction: __( 'Get Yoast SEO Premium', 'jetpack' ),
		href: 'https://yoa.st/yoast-upgrade-jetpack-boost',
	},
};

export const YoastPromoBanner = () => {
	const { hostname, isYoastFreeActive, isYoastPremiumActive } = useSelect( select => {
		const { getPlugin, getSite } = select( 'core' );

		const isPluginActive = slug => {
			const plugin = getPlugin( slug );
			return plugin && 'active' === plugin.status;
		};

		const url = new URL( getSite()?.url ?? window.location.href );

		return {
			hostname: url.hostname,
			isYoastFreeActive: isPluginActive( PLUGIN_SLUG_YOAST_FREE ),
			isYoastPremiumActive: isPluginActive( PLUGIN_SLUG_YOAST_PREMIUM ),
		};
	} );
	const getContentProps = () => {
		if ( ! isYoastFreeActive && ! isYoastPremiumActive ) {
			return Content.FREE;
		} else if ( isYoastFreeActive && ! isYoastPremiumActive ) {
			return Content.PREMIUM;
		}

		return null;
	};

	const contentProps = getContentProps();

	if ( ! contentProps ) {
		return null;
	}

	return (
		<Banner
			className="jp-seo-yoast-promo-banner"
			iconRaw={ yoastJetpackLogosSvg }
			title={ contentProps.title }
			callToAction={ contentProps.callToAction }
			href={ `${ contentProps.href }?domain=${ hostname }` }
		/>
	);
};
