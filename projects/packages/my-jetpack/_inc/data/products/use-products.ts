import { useQueries } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from 'react';
import { REST_API_SITE_PRODUCTS_ENDPOINT, QUERY_PRODUCT_KEY } from '../constants';
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
const useFetchProducts = ( productIds: string[] ) => {
	const queries =
		productIds?.map( productId => ( {
			queryKey: [ QUERY_PRODUCT_KEY, productId ],
			queryFn: () => apiFetch( { path: REST_API_SITE_PRODUCTS_ENDPOINT } ),
		} ) ) ?? [];
	const queryResult = useQueries( { queries } );

	return queryResult;
};

// Fetch the product data from the server and update the global state
const refetchProducts = async (
	refetch: (
		options?: RefetchOptions
	) => Promise< QueryObserverResult< ProductSnakeCase[], WP_Error > >
) => {
	const { data: refetchedProducts } = await refetch();

	refetchedProducts.forEach( product => {
		window.myJetpackInitialState.products.items[ product.slug ] = product;
	} );
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

const useProducts = ( productIds: string[] ) => {
	const allProducts = useAllProducts();
	const products = productIds?.map( productId => allProducts?.[ productId ] );
	const { refetch, isLoading } = useFetchProducts( productIds );

	return {
		products,
		refetch: useCallback( () => refetchProducts( refetch ), [ refetch ] ),
		isLoading,
	};
};

export default useProducts;
