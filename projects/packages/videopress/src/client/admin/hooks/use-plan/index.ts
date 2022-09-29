/*
 * types
 */
import { mapObjectKeysToCamel } from '../../../utils/map-object-keys-to-camel-case';
import { paidFeaturesProp, productOriginalProps, usePlanProps } from './types';

const { paidFeatures = <paidFeaturesProp>{}, productData = <productOriginalProps>{} } =
	window && window.jetpackVideoPressInitialState ? window.jetpackVideoPressInitialState : {};

export const usePlan = (): usePlanProps => {
	const pricingForUi = mapObjectKeysToCamel( productData.pricing_for_ui, true );

	return {
		features: paidFeatures,
		product: { ...mapObjectKeysToCamel( { ...productData }, true ), pricingForUi },
	};
};
