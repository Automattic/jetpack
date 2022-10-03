/*
 * types
 */
import { mapObjectKeysToCamel } from '../../../utils/map-object-keys-to-camel-case';
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

	return {
		features: paidFeatures,
		siteProduct: { ...mapObjectKeysToCamel( { ...siteProductData }, true ), pricingForUi },
		product: { ...mapObjectKeysToCamel( productData, true ), introductoryOffer },
	};
};
