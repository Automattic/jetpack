import { PRODUCT_STATUSES } from '../../constants';
import type { ProductCamelCase } from '../types';

// Every status Product::get_status() reports for a product that is_active(), plus a module product's user-connection error.
export const SWITCHED_ON_STATUSES: string[] = [
	PRODUCT_STATUSES.ACTIVE,
	PRODUCT_STATUSES.CAN_UPGRADE,
	PRODUCT_STATUSES.EXPIRED,
	PRODUCT_STATUSES.EXPIRING_SOON,
	PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR,
	PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING,
	PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION,
	PRODUCT_STATUSES.SITE_CONNECTION_ERROR,
	PRODUCT_STATUSES.USER_CONNECTION_ERROR,
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
