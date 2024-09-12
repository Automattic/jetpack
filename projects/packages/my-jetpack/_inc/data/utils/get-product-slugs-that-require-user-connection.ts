import { PRODUCT_STATUSES } from '../../constants';
import type { ProductCamelCase } from '../types';

const getProductSlugsThatRequireUserConnection = ( products: {
	[ key: string ]: ProductCamelCase;
} ) =>
	Object.values( products )
		.filter(
			( { requiresUserConnection, status } ) =>
				requiresUserConnection &&
				( status === PRODUCT_STATUSES.ACTIVE || PRODUCT_STATUSES.USER_CONNECTION_ERROR )
		)
		.map( ( { name } ) => name );

export default getProductSlugsThatRequireUserConnection;
