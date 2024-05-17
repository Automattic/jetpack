import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Banner } from 'components/banner';
import { connect } from 'react-redux';
import { getSiteRawUrl } from 'state/initial-state/reducer';
import { isPluginActive } from 'state/site/plugins';
import yoastJetpackLogosSvg from './yoast-jetpack-logos.svg';

const PLUGIN_SLUG_YOAST_FREE = 'wordpress-seo/wp-seo.php';
const PLUGIN_SLUG_YOAST_PREMIUM = 'wordpress-seo-premium/wp-seo-premium.php';

const Content = {
	FREE: {
		title: __( 'Boost your organic traffic with Jetpack and Yoast SEO', 'jetpack' ),
		callToAction: __( 'Get Yoast SEO', 'jetpack' ),
		hrefSource: 'jetpack-boost-yoast-free',
	},
	PREMIUM: {
		title: __(
			'Boost your organic traffic even more with Jetpack and Yoast SEO Premium',
			'jetpack'
		),
		callToAction: __( 'Get Yoast SEO Premium', 'jetpack' ),
		hrefSource: 'jetpack-boost-yoast-upgrade',
	},
};

const YoastPromoBanner = ( { isYoastFreeActive, isYoastPremiumActive, domain } ) => {
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
			href={ getRedirectUrl( contentProps.hrefSource, { query: `domain=${ domain }` } ) }
		/>
	);
};

export default connect( state => ( {
	isYoastFreeActive: isPluginActive( state, PLUGIN_SLUG_YOAST_FREE ),
	isYoastPremiumActive: isPluginActive( state, PLUGIN_SLUG_YOAST_PREMIUM ),
	domain: getSiteRawUrl( state ),
} ) )( YoastPromoBanner );
