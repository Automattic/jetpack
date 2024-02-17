import { PricingCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { getUpgradeURL, useConnection } from '$lib/stores/connection';
import { recordBoostEventAndRedirect } from '$lib/utils/analytics';
import './upgrade.module.scss';
import Forward from '$svg/forward';
import { usePricing } from '$lib/stores/pricing';
import CardPage from '$layout/card-page/card-page';

const Upgrade: React.FC = () => {
	const {
		site: { domain: siteDomain },
	} = Jetpack_Boost;

	const pricing = usePricing();

	const { connection } = useConnection();

	const goToCheckout = () => {
		recordBoostEventAndRedirect(
			getUpgradeURL(
				siteDomain,
				connection?.userConnected,
				connection?.wpcomBlogId ? connection?.wpcomBlogId.toString() : null
			),
			'checkout_from_pricing_page_in_plugin'
		);
	};

	if ( ! pricing ) {
		goToCheckout();
	}

	return (
		<CardPage
			sidebarItem={
				pricing && (
					<PricingCard
						title={ __( 'Jetpack Boost', 'jetpack-boost' ) }
						icon={ <Forward /> }
						priceBefore={ pricing.priceBefore / 12 }
						priceAfter={ pricing.priceAfter / 12 }
						priceDetails={ __( '/month, paid yearly', 'jetpack-boost' ) }
						currencyCode={ pricing.currencyCode }
						ctaText={ __( 'Upgrade Jetpack Boost', 'jetpack-boost' ) }
						onCtaClick={ goToCheckout }
					/>
				)
			}
			footerNote={ __(
				'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
				'jetpack-boost'
			) }
		>
			<h1 className="my-3">{ __( "Optimize your website's performance", 'jetpack-boost' ) }</h1>
			<h3 className="my-2">
				{ __(
					'Automatically regenerate critical CSS after site changes, and hunt down image issues with ease.',
					'jetpack-boost'
				) }
			</h3>
			<ul className="my-2">
				<li>{ __( 'Automatic critical CSS regeneration', 'jetpack-boost' ) }</li>
				<li>{ __( 'Performance scores are recalculated after each change', 'jetpack-boost' ) }</li>
				<li>{ __( 'Automatically scan your site for image size issues', 'jetpack-boost' ) }</li>
				<li>
					{ __( 'Historical performance scores with Core Web Vitals data', 'jetpack-boost' ) }
				</li>
				<li>
					{ __( 'Fine-tune your CDN images with customizable quality settings.', 'jetpack-boost' ) }
				</li>
				<li>{ __( 'Dedicated email support', 'jetpack-boost' ) }</li>
			</ul>
		</CardPage>
	);
};

export default Upgrade;
