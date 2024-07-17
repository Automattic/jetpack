import { useCallback } from 'react';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import { QUERY_PRODUCT_KEY } from '../constants';
import useSimpleQuery from '../use-simple-query';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import mapObjectKeysToCamel from '../utils/to-camel';
import type { ProductCamelCase, ProductSnakeCase, WP_Error } from '../types';
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

export const useAllProducts = (): { [ key: string ]: ProductCamelCase } => {
	const { items: products } = getMyJetpackWindowInitialState( 'products' );

	if ( ! products ) {
		return {};
	}

	return Object.entries( products ).reduce(
		( acc, [ key, product ] ) => ( { ...acc, [ key ]: prepareProductData( product ) } ),
		{}
	);
};

// Create query to fetch new product data from the server
const useFetchProduct = ( productId: string ) => {
	const queryResult = useSimpleQuery< ProductSnakeCase >( {
		name: QUERY_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		},
		options: { enabled: false },
	} );

	return queryResult;
};

// Fetch the product data from the server and update the global state
const refetchProduct = async (
	productId: string,
	refetch: (
		options?: RefetchOptions
	) => Promise< QueryObserverResult< ProductSnakeCase, WP_Error > >
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
	const { refetch, isLoading } = useFetchProduct( productId );

	return {
		detail: product,
		refetch: useCallback( () => refetchProduct( productId, refetch ), [ productId, refetch ] ),
		isLoading,
	};
};

export default useProduct;
