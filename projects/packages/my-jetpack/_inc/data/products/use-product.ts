import { ProductCamelCase } from '../types';
import useGetProductData from './use-get-product-data';

const useProduct: ( productId: string ) => {
	detail: ProductCamelCase;
} = productId => {
	const { product } = useGetProductData( productId );

	return {
		detail: product,
		isActive: product.status === 'active',
	};
};

export default useProduct;
