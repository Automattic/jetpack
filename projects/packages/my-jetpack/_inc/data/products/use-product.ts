import useProducts from './use-products';

const useProduct = ( productId: string ) => {
	const { products, refetch, isLoading, isRefetching } = useProducts( [ productId ] );
	return {
		detail: products[ 0 ],
		refetch,
		isLoading,
		isRefetching,
	};
};

export default useProduct;
