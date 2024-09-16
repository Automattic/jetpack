import { useCallback } from 'react';
import { REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT } from '../constants';
import { QUERY_PRODUCT_BY_OWNERSHIP_KEY } from '../constants';
import useSimpleQuery from '../use-simple-query';
import type { WP_Error } from '../types';
import type { QueryObserverResult } from '@tanstack/react-query';

// Create query to fetch new product data from the server
const useFetchProductsByOwnership = () => {
	const queryResult = useSimpleQuery<
		Record< 'ownedProducts' | 'unownedProducts', JetpackModule[] >
	>( {
		name: `${ QUERY_PRODUCT_BY_OWNERSHIP_KEY }`,
		query: {
			path: REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT,
		},
	} );

	return queryResult;
};

// Fetch the product data from the server
const refetchProduct = async (
	refetch: () => Promise<
		QueryObserverResult< Record< 'ownedProducts' | 'unownedProducts', JetpackModule[] >, WP_Error >
	>
) => {
	const { data: refetchedProduct } = await refetch();

	return refetchedProduct;
};

const useProductsByOwnership = () => {
	const { data, refetch, isLoading } = useFetchProductsByOwnership();

	return {
		refetch: useCallback( () => refetchProduct( refetch ), [ refetch ] ),
		data,
		isLoading,
	};
};

export default useProductsByOwnership;
