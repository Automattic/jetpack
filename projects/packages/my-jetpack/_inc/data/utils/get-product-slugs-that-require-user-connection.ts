import { PRODUCT_STATUSES } from '../../constants';
import type { ProductCamelCase } from '../types';

// Statuses of a product that is switched on, whatever its plan or connection says.
export const SWITCHED_ON_STATUSES: string[] = [
	PRODUCT_STATUSES.ACTIVE,
	PRODUCT_STATUSES.CAN_UPGRADE,
	PRODUCT_STATUSES.USER_CONNECTION_ERROR,
	PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING,
	PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR,
	PRODUCT_STATUSES.EXPIRING_SOON,
];

const getProductSlugsThatRequireUserConnection = ( products: {
	[ key: string ]: ProductCamelCase;
} ) =>
	Object.values( products )
		.filter(
			( { requiresUserConnection, status } ) =>
				requiresUserConnection && SWITCHED_ON_STATUSES.includes( status )
		)
		.map( ( { name } ) => name );

export default getProductSlugsThatRequireUserConnection;
