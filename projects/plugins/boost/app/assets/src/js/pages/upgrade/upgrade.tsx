import { PricingCard } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import ActivateLicense from '$features/activate-license/activate-license';
import { getUpgradeURL } from '$lib/stores/connection';
import { recordBoostEventAndRedirect } from '$lib/utils/analytics';
import BackButton from '$features/ui/back-button/back-button';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import JetpackLogo from '$svg/jetpack-green';
import styles from './upgrade.module.scss';

type UpgradeProps = {
	pricing: ( typeof Jetpack_Boost )[ 'pricing' ];
	siteDomain: string;
	userConnected: boolean;
};

const Upgrade: React.FC< UpgradeProps > = ( { pricing, siteDomain, userConnected } ) => {
	const goToCheckout = () => {
		recordBoostEventAndRedirect(
			getUpgradeURL( siteDomain, userConnected ),
			'checkout_from_pricing_page_in_plugin'
		);
	};

	if ( ! ( 'yearly' in pricing ) ) {
		goToCheckout();
	}

	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header>
				<ActivateLicense />
			</Header>

			<div className={ styles.body }>
				<div
					className={ classNames(
						'jb-container jb-container--fixed mt-2',
						styles[ 'container--fixed' ]
					) }
				>
					<BackButton />
					<div className="jb-card">
						<div className="jb-card__content">
							<JetpackLogo className="my-2" />
							<h1 className="my-2">
								{ __( "Optimize your website's performance", 'jetpack-boost' ) }
							</h1>
							<p className="jb-card__summary my-2">
								{ __(
									'Automatically regenerate critical CSS after site changes, and hunt down image issues with ease.',
									'jetpack-boost'
								) }
							</p>
							<ul className="jb-checklist my-2">
								<li>{ __( 'Automatic critical CSS regeneration', 'jetpack-boost' ) }</li>
								<li>
									{ __( 'Performance scores are recalculated after each change', 'jetpack-boost' ) }
								</li>
								<li>
									{ __( 'Automatically scan your site for image size issues', 'jetpack-boost' ) }
								</li>
								<li>
									{ __(
										'Historical performance scores with Core Web Vitals data',
										'jetpack-boost'
									) }
								</li>
								<li>
									{ __(
										'Fine-tune your CDN images with customizable quality settings.',
										'jetpack-boost'
									) }
								</li>
								<li>{ __( 'Dedicated email support', 'jetpack-boost' ) }</li>
							</ul>
						</div>

						<div className="jb-card__cta px-2 my-4">
							{ 'yearly' in pricing && (
								<PricingCard
									title={ __( 'Jetpack Boost', 'jetpack-boost' ) }
									icon={ `${ Jetpack_Boost.site.staticAssetPath }images/forward.svg` }
									priceBefore={ pricing.yearly.priceBefore / 12 }
									priceAfter={ pricing.yearly.priceAfter / 12 }
									priceDetails={ __( '/month, paid yearly', 'jetpack-boost' ) }
									currencyCode={ pricing.yearly.currencyCode }
									ctaText={ __( 'Upgrade Jetpack Boost', 'jetpack-boost' ) }
									onCtaClick={ goToCheckout }
								/>
							) }
						</div>
					</div>
					<footer className="jb-footer-note">
						{ __(
							'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
							'jetpack-boost'
						) }
					</footer>
				</div>
			</div>

			<div className={ styles.footer }>
				<Footer />
			</div>
		</div>
	);
};

export default Upgrade;
