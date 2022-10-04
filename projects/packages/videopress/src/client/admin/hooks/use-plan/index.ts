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

	const purchases = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).getPurchases(),
		[]
	);

	return {
		features: paidFeatures,
		siteProduct: { ...mapObjectKeysToCamel( { ...siteProductData }, true ), pricingForUi },
		product: { ...mapObjectKeysToCamel( productData, true ), introductoryOffer },
		purchases,
	};
};
