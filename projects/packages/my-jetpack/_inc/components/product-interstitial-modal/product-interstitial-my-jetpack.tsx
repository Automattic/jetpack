import { Button, ProductPrice, getRedirectUrl } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import LoadingBlock from '../loading-block';
import {
	ProductInterstitialModal,
	ProductInterstitialFeatureList,
	ProductInterstitialModalCta,
} from '.';

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
	/**
	 * Optional description for the product that overwrites the description from the product details
	 */
	description?: string;
	/**
	 * Optional features for the product that overwrites the features from the product details
	 */
	features?: string[];
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
	description,
	features,
	...props
} ) => {
	const { recordEvent } = useAnalytics();
	const { detail, isLoading } = useProduct( slug );
	const {
		title,
		longDescription: detailDescription,
		features: detailFeatures,
		pricingForUi,
	} = detail;

	// allow plugins to overwrite the description and features from the product details
	const modalDescription = description || detailDescription;
	const modalFeatures = features || detailFeatures;

	// Get pricing for a plugin - TODO: extract price to a hook or a component
	const priceSource = slug === 'boost' ? pricingForUi?.tiers?.upgraded : pricingForUi;
	let price, discountPrice;

	if ( slug === 'boost' ) {
		// component price structure
		price = priceSource?.fullPrice / 12;
		discountPrice = priceSource?.discountPrice / 12;
	} else {
		price = priceSource?.fullPricePerMonth;
		discountPrice = priceSource?.discountPricePerMonth;
	}

	const { currencyCode, introductoryOffer, productTerm } = priceSource || {};

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

	const priceComponent = isLoading ? (
		<LoadingBlock width="100%" height="100px" />
	) : (
		<ProductPrice
			currency={ currencyCode }
			price={ price }
			offPrice={ productPrice }
			showNotOffPrice={ price > productPrice } // show discounted price only if the new price is greater than the product price
			isNotConvenientPrice={ false }
			hidePriceFraction={ false }
			hideDiscountLabel={ productPrice >= price }
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
			description={ modalDescription }
			priceComponent={ priceComponent }
			modalMainButton={ <ProductInterstitialModalCta slug={ slug } /> }
			onOpen={ handleOpen }
			onClose={ handleClose }
			isLoading={ isLoading }
			{ ...props }
		>
			<>
				{ ( isLoading || modalFeatures ) && (
					<ProductInterstitialFeatureList isLoading={ isLoading } features={ modalFeatures } />
				) }
				{ additionalContent }
				{ children }
			</>
		</ProductInterstitialModal>
	);
};

const ProductInterstitialPluginWithQueryClient: FC< ProductInterstitialPluginProps > = props => {
	const queryClient = new QueryClient();

	return (
		<QueryClientProvider client={ queryClient }>
			<ProductInterstitialPlugin { ...props } />
		</QueryClientProvider>
	);
};

export default ProductInterstitialPluginWithQueryClient;
