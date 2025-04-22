import useProducts from './use-products';

const useProduct = ( productId: string ) => {
	const { products, refetch, isLoading } = useProducts( [ productId ] );
	return {
		detail: products[ 0 ],
		refetch,
		isLoading,
	};
};

export default useProduct;
