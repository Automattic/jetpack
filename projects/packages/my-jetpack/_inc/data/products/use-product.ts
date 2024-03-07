import { useCallback } from 'react';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import { QUERY_PRODUCT_KEY } from '../constants';
import useSimpleQuery from '../use-simple-query';
import mapObjectKeysToCamel from '../utils/to-camel';
import type { ProductCamelCase, ProductSnakeCase } from '../types';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';

const getFullPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.fullPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.fullPrice;
};

const getDiscountPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.discountPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.discountPrice;
};

export const useAllProducts = () => {
	const initialState = window?.myJetpackInitialState;
	const products = initialState?.products?.items || {};

	return products;
};

// Create query to fetch new product data from the server
const useFetchProduct = ( productId: string ) => {
	const queryResult = useSimpleQuery< ProductSnakeCase >(
		QUERY_PRODUCT_KEY,
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		},
		{ enabled: false }
	);

	return queryResult;
};

// Fetch the product data from the server and update the global state
const refetchProduct = async (
	productId: string,
	refetch: ( options?: RefetchOptions ) => Promise< QueryObserverResult< ProductSnakeCase, Error > >
) => {
	const { data: refetchedProduct } = await refetch();

	window.myJetpackInitialState.products.items[ productId ] = refetchedProduct;
};

const prepareProductData = ( product: ProductSnakeCase ) => {
	// The mapObjectKeysToCamel is typed correctly, however we are adding new fields
	// to the product object that don't exist on the global state object
	// Therefore we still need to cast the object to the correct type
	const camelProduct = mapObjectKeysToCamel( product ) as ProductCamelCase;

	camelProduct.features = camelProduct.features || [];
	camelProduct.supportedProducts = camelProduct.supportedProducts || [];

	camelProduct.pricingForUi.fullPricePerMonth = getFullPricePerMonth( camelProduct );
	camelProduct.pricingForUi.discountPricePerMonth = getDiscountPricePerMonth( camelProduct );

	return camelProduct;
};

const useProduct = ( productId: string ) => {
	const allProducts = useAllProducts();
	const product = allProducts?.[ productId ];
	const camelProduct = prepareProductData( product );
	const { refetch, isLoading } = useFetchProduct( productId );

	return {
		detail: camelProduct,
		refetch: useCallback( () => refetchProduct( productId, refetch ), [ productId, refetch ] ),
		isLoading,
	};
};

export default useProduct;
