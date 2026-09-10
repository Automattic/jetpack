import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { ProductInterstitialMyJetpack } from '@automattic/jetpack-my-jetpack/components/product-interstitial-modal/index';
import boostImage from '@automattic/jetpack-my-jetpack/components/product-interstitial/assets/boost.webp';
import { __ } from '@wordpress/i18n';
import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';
import type { ReactNode } from 'react';

type InterstitialModalCTAProps = {
	description?: string;
	identifier: string;
	customModalTrigger?: ReactNode;
};

const InterstitialModalCTA = ( {
	description = '',
	identifier,
	customModalTrigger,
}: InterstitialModalCTAProps ) => {
	const learnMoreUrl = getRedirectUrl( 'jetpack-boost-interstitial-modal-learn-more' );

	return (
		<ProductInterstitialMyJetpack
			slug="boost"
			customModalTrigger={
				customModalTrigger ?? <UpgradeCTA identifier={ identifier } description={ description } />
			}
			buttonLabel={ __( 'Upgrade now', 'jetpack-boost' ) }
			isWithVideo={ false }
			secondaryColumn={
				<div>
					<img src={ boostImage } alt="Boost" />
				</div>
			}
			secondaryButtonHref={ learnMoreUrl }
			description={ __(
				'Unlock the full potential of Jetpack Boost with automated performance improvements and advanced image optimization for a consistently fast site.',
				'jetpack-boost'
			) }
			features={ [
				__( 'Automated critical CSS generation', 'jetpack-boost' ),
				__( 'Image CDN and quality controls', 'jetpack-boost' ),
				__( 'Image guide and performance history', 'jetpack-boost' ),
				__( 'Priority support', 'jetpack-boost' ),
			] }
		/>
	);
};

export default InterstitialModalCTA;
