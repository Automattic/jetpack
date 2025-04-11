import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useEffect, useState } from 'react';

const getPriceData = priceInfo => {
	return {
		price: priceInfo.full_price / 12,
		introOffer: priceInfo.introductory_offer
			? priceInfo.introductory_offer.cost_per_interval / 12
			: null,
	};
};

const parsePromotedProductInfo = priceInfo => {
	const currencyCode = priceInfo.currency_code || 'USD';
	return {
		currencyCode,
		v1: getPriceData( priceInfo ),
	};
};

/**
 * Hook to retrieve the product info for the pricing page.
 *
 * @return {object} - The product info containing the currency and the plan prices.
 */
export default function useProductInfo() {
	const [ productInfo, setProductInfo ] = useState( null );

	const getAsyncInfo = useCallback( async () => {
		try {
			const socialPromotedProductInfo = await apiFetch( {
				path: addQueryArgs( '/my-jetpack/v1/site/products', { products: 'social' } ),
			} );
			const pricingInfo = socialPromotedProductInfo?.social?.pricing_for_ui;
			pricingInfo && setProductInfo( parsePromotedProductInfo( pricingInfo ) );
		} catch {
			setProductInfo( null );
		}
	}, [] );

	useEffect( () => {
		getAsyncInfo();
	}, [ getAsyncInfo ] );

	return [ productInfo ];
}
