import { useCallback } from 'react';
import { useAllProducts } from './use-all-products';

const useProducts = ( productSlugs: string | string[] ) => {
	const productIds = Array.isArray( productSlugs ) ? productSlugs : [ productSlugs ];

	const { data: allProducts, isLoading, isRefetching, refetch } = useAllProducts();
	const products = productIds.map( productId => allProducts?.[ productId ] );

	return {
		products,
		refetch: useCallback( async () => {
			await refetch();
		}, [ refetch ] ),
		isLoading,
		isRefetching,
	};
};

export default useProducts;
