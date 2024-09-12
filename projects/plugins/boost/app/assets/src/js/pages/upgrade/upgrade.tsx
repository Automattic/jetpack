import { PricingCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { getUpgradeURL, useConnection } from '$lib/stores/connection';
import { recordBoostEventAndRedirect } from '$lib/utils/analytics';
import './upgrade.module.scss';
import Forward from '$svg/forward';
import { usePricing } from '$lib/stores/pricing';
import CardPage from '$layout/card-page/card-page';
import { createInterpolateElement } from '@wordpress/element';

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
			<h1 className="my-3">
				{ __( "Optimize your website's performance on the go", 'jetpack-boost' ) }
			</h1>
			<h3 className="my-2">
				{ __(
					'Unlock the full potential of Jetpack Boost with automated performance optimization tools and more.',
					'jetpack-boost'
				) }
			</h3>
			<ul className="my-2">
				<li>
					{ createInterpolateElement(
						__(
							"<strong>Automated Critical CSS Generation:</strong> Improve your site's load time. Say goodbye to manual tweaks and boost your speed scores with zero effort.",
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Automated Image Scanning:</strong> Always be on top of potential image size issues that might impact your site load time and SEO ranking.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>In-depth Performance Insights:</strong> Track your success with historical performance and Core Web Vitals scores to see how your site improves over time.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Customizable Image Optimization:</strong> Control your image quality and loading speeds with customizable CDN settings, balancing aesthetics with efficiency.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Expert Support With a Personal Touch:</strong> Enjoy dedicated email support from our Happiness Engineers, ensuring a smoother experience and peace of mind.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
			</ul>
		</CardPage>
	);
};

export default Upgrade;
