import getProductSlugsThatRequireUserConnection from '../get-product-slugs-that-require-user-connection';
import type { ProductCamelCase } from '../../types';

describe( 'getProductSlugsThatRequireUserConnection', () => {
	it.each( [
		[ 'a switched-on product that needs an account', true, 'active', [ 'search' ] ],
		[ 'one that is on but missing its account', true, 'user_connection_error', [ 'search' ] ],
		[ 'not a product that is off', true, 'inactive', [] ],
		[ 'not one that needs no account', false, 'active', [] ],
	] )( 'names %s', ( _, requiresUserConnection, status, names ) => {
		const products = {
			search: { name: 'search', requiresUserConnection, status } as ProductCamelCase,
		};

		expect( getProductSlugsThatRequireUserConnection( products ) ).toEqual( names );
	} );
} );
