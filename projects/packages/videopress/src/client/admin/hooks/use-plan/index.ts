/*
 * types
 */
import { mapObjectKeysToCamel } from '../../../utils/map-object-keys-to-camel-case';
import { paidFeaturesProp, productOriginalProps, usePlanProps } from './types';

const { paidFeatures = <paidFeaturesProp>{}, siteProductData = <productOriginalProps>{} } =
	window && window.jetpackVideoPressInitialState ? window.jetpackVideoPressInitialState : {};

export const usePlan = (): usePlanProps => {
	const pricingForUi = mapObjectKeysToCamel( siteProductData.pricing_for_ui, true );

	return {
		features: paidFeatures,
		siteProduct: { ...mapObjectKeysToCamel( { ...siteProductData }, true ), pricingForUi },
	};
};
