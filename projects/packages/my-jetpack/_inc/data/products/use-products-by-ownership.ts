import { REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT } from '../constants';
import { QUERY_PRODUCT_BY_OWNERSHIP_KEY } from '../constants';
import useSimpleQuery from '../use-simple-query';
// import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import type { ProductSnakeCase } from '../types';
// import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';

// Create query to fetch new product data from the server
const useFetchProductsByOwnership = () => {
	const queryResult = useSimpleQuery< ProductSnakeCase >( {
		name: `${ QUERY_PRODUCT_BY_OWNERSHIP_KEY }`,
		query: {
			path: REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT,
		},
	} );

	return queryResult;
};

// Fetch the product data from the server and update the global state
// const refetchProduct = async (
// 	productId: string,
// 	refetch: (
// 		options?: RefetchOptions
// 	) => Promise< QueryObserverResult< ProductSnakeCase, WP_Error > >
// ) => {
// 	const { data: refetchedProduct } = await refetch();

// 	window.myJetpackInitialState.products.items[ productId ] = refetchedProduct;
// };

const useProductsByOwnership = () => {
	const { data, isLoading } = useFetchProductsByOwnership();

	return {
		// refetch: useCallback( () => refetchProduct( productId, refetch ), [ productId, refetch ] ),
		products: data, //TODO: either pass products or update the windows opbject like refetchProduct
		isLoading,
	};
};

export default useProductsByOwnership;
