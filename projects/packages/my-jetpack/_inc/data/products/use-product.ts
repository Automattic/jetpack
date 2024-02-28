import { ProductCamelCase } from '../types';
import useActivate from './use-activate';
import useGetProductData from './use-get-product-data';

const useProduct: ( productId: string ) => {
	detail: ProductCamelCase;
} = productId => {
	const { product } = useGetProductData( productId );

	const { mutate: activate, isPending: isActivating } = useActivate( productId, 'activate' );
	const { mutate: deactivate, isPending: isDeactivating } = useActivate( productId, 'deactivate' );

	return {
		activate,
		deactivate,
		detail: product,
		isActive: product.status === 'active',
		isFetching: isActivating || isDeactivating,
	};
};

export default useProduct;
