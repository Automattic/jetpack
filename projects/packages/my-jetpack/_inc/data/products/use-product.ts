import { ProductCamelCase } from '../types';
import useStateProduct from './use-state-product';

const useProduct: ( productId: string ) => {
	detail: ProductCamelCase;
} = productId => {
	const { product } = useStateProduct( productId );

	return {
		detail: product,
		isActive: product.status === 'active',
	};
};

export default useProduct;
