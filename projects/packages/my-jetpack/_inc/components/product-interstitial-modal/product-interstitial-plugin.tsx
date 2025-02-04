import { Button, ProductPrice, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import {
	ProductInterstitialModal,
	ProductInterstitialFeatureList,
	ProductInterstitialModalCta,
} from './';

interface ProductInterstitialPluginProps {
	/**
	 * Child elements to be rendered within the placement
	 */
	children?: React.ReactNode;
	/**
	 * Product slug
	 */
	slug: string;
	/**
	 * Callback function to be called when the modal is opened
	 */
	onOpen?: () => void;
	/**
	 * Callback function to be called when the modal is closed
	 */
	onClose?: () => void;
}

/**
 * Component that handles the placement of product interstitial content for a product slug
 *
 * @param {ProductInterstitialPluginProps} props - Component properties
 * @return {React.ReactElement|null} The rendered component
 */
const ProductInterstitialPlugin: FC< ProductInterstitialPluginProps > = ( {
	slug,
	children,
	onOpen,
	onClose,
	...props
} ) => {
	const { recordEvent } = useAnalytics();
	const { detail } = useProduct( slug );

	const { title, longDescription, features, pricingForUi } = detail;

	const {
		fullPricePerMonth: price,
		currencyCode,
		discountPricePerMonth: discountPrice,
		introductoryOffer,
		productTerm,
	} = pricingForUi;

	let priceDescription;
	if ( introductoryOffer?.intervalUnit === 'month' && introductoryOffer?.intervalCount === 1 ) {
		priceDescription = sprintf(
			// translators: %s is the monthly price for a product
			__( 'trial for the first month, then $%s /month, billed yearly', 'jetpack-my-jetpack' ),
			price
		);
	} else if ( productTerm === 'year' ) {
		priceDescription = __( '/month, paid yearly', 'jetpack-my-jetpack' );
	} else {
		priceDescription = __(
			'/month',
			'jetpack-my-jetpack',
			/* dummy arg to avoid bad minification */ 0
		);
	}

	const productPrice = introductoryOffer?.reason ? price : discountPrice;

	// TODO: check referrer url from product-details-card

	const priceComponent = (
		<ProductPrice
			currency={ currencyCode }
			price={ price }
			offPrice={ productPrice }
			showNotOffPrice={ true }
			isNotConvenientPrice={ false }
			hidePriceFraction={ false }
			hideDiscountLabel={ productPrice > price }
			legend={ priceDescription }
		/>
	);

	const handleOpen = useCallback( () => {
		recordEvent( 'jetpack_modal_interstitial_open', {
			placement: 'product-page',
			context: 'my-jetpack',
			product_slug: slug,
		} );
		onOpen?.();
	}, [ recordEvent, slug, onOpen ] );

	const handleClose = useCallback( () => {
		recordEvent( 'jetpack_modal_interstitial_close', {
			placement: 'product-page',
			context: 'my-jetpack',
			product_slug: slug,
		} );
		onClose?.();
	}, [ recordEvent, slug, onClose ] );

	let additionalContent = null;

	if ( slug === 'jetpack-ai' ) {
		additionalContent = (
			<p>
				{ createInterpolateElement(
					__(
						'* Limits apply for high request capacity. <link>Learn more about it here</link>.',
						'jetpack-my-jetpack'
					),
					{
						link: (
							<Button
								href={ getRedirectUrl( 'ai-assistant-fair-usage-policy' ) }
								variant="link"
								weight="regular"
								size="small"
								target="_blank"
							/>
						),
					}
				) }
			</p>
		);
	}

	return (
		<ProductInterstitialModal
			title={ title }
			description={ longDescription }
			priceComponent={ priceComponent }
			modalMainButton={ <ProductInterstitialModalCta slug={ slug } /> }
			onOpen={ handleOpen }
			onClose={ handleClose }
			{ ...props }
		>
			<>
				{ features && <ProductInterstitialFeatureList features={ features } /> }
				{ additionalContent }
				{ children }
			</>
		</ProductInterstitialModal>
	);
};

export default ProductInterstitialPlugin;
