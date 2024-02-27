import { ProductCamelCase } from '../types';
import useGetProductData from './use-get-product-data';

type useProductType = ( productId: string ) => {
	detail: ProductCamelCase;
	isFetching: boolean;
};

const useProduct: useProductType = productId => {
	const product = useGetProductData( productId );

	return {
		detail: product,
		isActive: product.status === 'active',
		isFetching: false,
	};
};

export default useProduct;
