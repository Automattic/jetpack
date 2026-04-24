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
	productPriceOriginalProps,
} from './types';

const {
	paidFeatures = < paidFeaturesProp >{},
	siteProductData = < siteProductOriginalProps >{},
	productData = < productOriginalProps >{},
	productPrice = < productPriceOriginalProps >{},
} = window && window.jetpackVideoPressInitialState ? window.jetpackVideoPressInitialState : {};

export const usePlan = (): usePlanProps => {
	const pricingForUi = mapObjectKeysToCamel( siteProductData.pricing_for_ui, true );
	const introductoryOffer = mapObjectKeysToCamel( productData.introductory_offer, true );
	const videoPressProduct = { ...mapObjectKeysToCamel( productData, true ), introductoryOffer };

	const { features, isFetchingFeatures } = useSelect( select => {
		return {
			features: ( select( STORE_ID ) as VideopressSelectors ).getFeatures(),
			isFetchingFeatures: ( select( STORE_ID ) as VideopressSelectors ).isFetchingFeatures(),
		};
	}, [] );

	// Use dynamic features from API, fall back to static paidFeatures from initial state while loading
	const resolvedFeatures = features ?? paidFeatures;

	return {
		features: resolvedFeatures,
		siteProduct: { ...mapObjectKeysToCamel( { ...siteProductData }, true ), pricingForUi },
		product: videoPressProduct,
		productPrice,

		hasVideoPressPurchase: Boolean(
			resolvedFeatures?.isVideoPress1TBSupported || resolvedFeatures?.isVideoPressUnlimitedSupported
		),
		isFetchingFeatures,
	};
};
