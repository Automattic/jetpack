import { PRODUCT_STATUSES } from '../../components/product-card';
import type { ProductCamelCase } from '../types';

const getProductSlugsThatRequireUserConnection = ( products: {
	[ key: string ]: ProductCamelCase;
} ) =>
	Object.values( products )
		.filter(
			( { requiresUserConnection, status } ) =>
				requiresUserConnection &&
				( status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.ERROR )
		)
		.map( ( { name } ) => name );

export default getProductSlugsThatRequireUserConnection;
