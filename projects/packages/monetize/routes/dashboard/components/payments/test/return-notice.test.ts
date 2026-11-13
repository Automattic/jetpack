import { readStripeReturn, withoutStripeReturn } from '../return-notice';

describe( 'readStripeReturn', () => {
	it.each( [
		[ { page: 'jetpack-monetize', stripe_connect_success: 'earn' }, 'connected' ],
		[ { page: 'jetpack-monetize', stripe_connect_cancelled: 1 }, 'cancelled' ],
		[ { page: 'jetpack-monetize' }, null ],
	] )( 'reads %o, and the rest keeps only the page', ( search, result ) => {
		expect( readStripeReturn( search ) ).toBe( result );
		expect( withoutStripeReturn( search ) ).toEqual( { page: 'jetpack-monetize' } );
	} );
} );
