/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { mapObjectKeysToCamel } from '../../../utils/map-object-keys-to-camel-case';
/**
 * types
 */
import { VideopressSelectors } from '../../types';
import {
	paidFeaturesProp,
	productOriginalProps,
	siteProductOriginalProps,
	usePlanProps,
} from './types';

const {
	paidFeatures = <paidFeaturesProp>{},
	siteProductData = <siteProductOriginalProps>{},
	productData = <productOriginalProps>{},
} = window && window.jetpackVideoPressInitialState ? window.jetpackVideoPressInitialState : {};

export const usePlan = (): usePlanProps => {
	const pricingForUi = mapObjectKeysToCamel( siteProductData.pricing_for_ui, true );
	const introductoryOffer = mapObjectKeysToCamel( productData.introductory_offer, true );
	const videoPressProduct = { ...mapObjectKeysToCamel( productData, true ), introductoryOffer };

	const { purchases, isFetchingPurchases } = useSelect( select => {
		return {
			purchases: ( select( STORE_ID ) as VideopressSelectors ).getPurchases(),
			isFetchingPurchases: ( select( STORE_ID ) as VideopressSelectors ).isFetchingPurchases(),
		};
	}, [] );
	const purchasesCamelCase = purchases.map( purchase => mapObjectKeysToCamel( purchase, true ) );

	/**
	 * Check if the user has a plan that includes VideoPress
	 *
	 * @param {string} productSlug - wpcom prtoduct slug
	 * @returns {boolean}            true if the product is owned by the user
	 */
	function hasPurchase( productSlug ) {
		return purchasesCamelCase.some( product => product.productSlug === productSlug );
	}

	return {
		features: paidFeatures,
		siteProduct: { ...mapObjectKeysToCamel( { ...siteProductData }, true ), pricingForUi },
		product: videoPressProduct,

		// Site purchases
		purchases: purchasesCamelCase,
		hasVideoPressPurchase:
			hasPurchase( 'jetpack_videopress' ) || hasPurchase( 'jetpack_videopress_monthly' ),
		isFetchingPurchases,
	};
};
