import { PRODUCT_STATUSES } from '../../components/product-card';
import type { ProductCamelCase } from '../types';

const getProductSlugsThatRequireUserConnection = ( products: ProductCamelCase[] ) => {
	return Object.keys( products )
		.filter( product => {
			const currentProduct = products[ product ];
			return (
				currentProduct?.requires_user_connection &&
				( currentProduct?.status === PRODUCT_STATUSES.ACTIVE ||
					currentProduct?.status === PRODUCT_STATUSES.ERROR )
			);
		} )
		.map( product => products[ product ]?.name );
};

export default getProductSlugsThatRequireUserConnection;
