import { useCallback } from 'react';
import { REST_API_SITE_PRODUCTS_ENDPOINT, QUERY_PRODUCT_KEY } from '../constants';
import useSimpleQuery from '../use-simple-query';
import { useAllProducts } from './use-all-products';
import type { ProductSnakeCase, WP_Error } from '../types';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';

// Create query to fetch new product data from the server
const useFetchProducts = ( productIds: string[] ) => {
	const productsQueryArg =
		productIds && productIds?.length ? `?products=${ productIds?.join( ',' ) }` : '';
	const queryResult = useSimpleQuery< { [ key: string ]: ProductSnakeCase } >( {
		name: `${ QUERY_PRODUCT_KEY }`,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }${ productsQueryArg }`,
		},
		options: { enabled: false },
	} );

	return queryResult;
};

// Fetch the product data from the server and update the global state
const refetchProducts = async (
	refetch: (
		options?: RefetchOptions
	) => Promise< QueryObserverResult< { [ key: string ]: ProductSnakeCase }, WP_Error > >
) => {
	const { data: refetchedProducts } = await refetch();

	Object.keys( refetchedProducts ).forEach( productSlug => {
		window.myJetpackInitialState.products.items[ productSlug ] = refetchedProducts[ productSlug ];
	} );
};

const useProducts = ( productSlugs: string | string[] ) => {
	const productIds = Array.isArray( productSlugs ) ? productSlugs : [ productSlugs ];

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
