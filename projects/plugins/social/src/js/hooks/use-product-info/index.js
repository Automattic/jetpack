import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from 'react';

const getPriceData = productObject => {
	return {
		price: productObject.cost / 12,
		introOffer: productObject.introductory_offer
			? productObject.introductory_offer.cost_per_interval / 12
			: null,
	};
};

const parsePromotedProductInfo = response => {
	const currencyCode = response?.advanced?.currency_code || response?.basic?.currency_code || 'USD';
	return {
		currencyCode,
		basic: response?.basic ? getPriceData( response.basic ) : null,
		advanced: response?.advanced ? getPriceData( response.advanced ) : null,
	};
};

/**
 * Hook to retrieve the product info for the pricing page.
 *
 * @returns {object} - The product info containing the currency and the plan prices.
 */
export default function useProductInfo() {
	const [ productInfo, setProductInfo ] = useState( null );

	const getAsyncInfo = useCallback( async () => {
		try {
			const socialPromotedProductInfo = await apiFetch( {
				path: '/jetpack/v4/social-product-info',
			} );
			setProductInfo( parsePromotedProductInfo( socialPromotedProductInfo ) );
		} catch {
			setProductInfo( null );
		}
	}, [] );

	useEffect( () => {
		getAsyncInfo();
	}, [ getAsyncInfo ] );

	return [ productInfo ];
}
