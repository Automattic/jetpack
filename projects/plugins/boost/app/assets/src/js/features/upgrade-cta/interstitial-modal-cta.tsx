import { useCallback } from 'react';
import { ProductInterstitialMyJetpack } from '@automattic/jetpack-my-jetpack/components/product-interstitial-modal';
import boostImage from '@automattic/jetpack-my-jetpack/components/product-interstitial/boost.png';
import { __ } from '@wordpress/i18n';
import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';
import { recordBoostPixelEvent } from '$lib/utils/analytics';

type InterstitialModalCTAProps = {
	description: string;
	identifier: string;
};

const InterstitialModalCTA = ( { description, identifier }: InterstitialModalCTAProps ) => {
	const upgradeClickHandlerModal = useCallback( () => {
		// record event for opening a modal
		recordBoostPixelEvent( 'jetpack_boost_modal_interstitial_view', {
			placement: 'product-page',
			context: 'jetpack-boost',
			identifier: identifier,
		} );
	}, [ identifier ] );

	return (
		<ProductInterstitialMyJetpack
			slug="boost"
			onOpen={ upgradeClickHandlerModal }
			customModalTrigger={ <UpgradeCTA identifier={ identifier } description={ description } /> }
			buttonLabel={ __( 'Upgrade now', 'jetpack-boost' ) }
			isWithVideo={ false }
			secondaryColumn={
				<div>
					<img src={ boostImage } alt="Boost" />
				</div>
			}
			secondaryButtonHref="https://jetpack.com/boost/"
			description={ __(
				'Unlock the full potential of Jetpack Boost with automated performance optimization tools and more.',
				'jetpack-boost'
			) }
			features={ [
				__( 'Automated Critical CSS Generation', 'jetpack-boost' ),
				__( 'Automated Image Scanning', 'jetpack-boost' ),
				__( 'In-depth Performance Insights', 'jetpack-boost' ),
				__( 'Customizable Image Optimization', 'jetpack-boost' ),
				__( 'Expert Support With Personal Assistance Available', 'jetpack-boost' ),
			] }
		/>
	);
};

export default InterstitialModalCTA;
