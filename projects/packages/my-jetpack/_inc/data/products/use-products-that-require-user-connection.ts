import { PRODUCT_STATUSES } from '../../components/product-card';
import { useAllProducts } from './use-product';
import type { StateProducts } from '../types';

const useProductsThatRequireUserConnection: () => Array< keyof StateProducts > = () => {
	const products = useAllProducts();

	const productsThatRequireUserConnection = Object.keys( products ).reduce(
		( current: Array< keyof StateProducts >, product ) => {
			const currentProduct = products[ product ];
			const requires =
				currentProduct?.requires_user_connection &&
				( currentProduct?.status === PRODUCT_STATUSES.ACTIVE ||
					currentProduct?.status === PRODUCT_STATUSES.ERROR );
			if ( requires ) {
				current.push( currentProduct?.name );
			}
			return current;
		},
		[]
	);

	return productsThatRequireUserConnection;
};

export default useProductsThatRequireUserConnection;
