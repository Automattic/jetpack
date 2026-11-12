import { takeStripeReturn } from '../return-notice';

describe( 'takeStripeReturn', () => {
	it.each( [
		[ '?page=jetpack-monetize&stripe_connect_success=earn', 'connected' ],
		[ '?page=jetpack-monetize&stripe_connect_cancelled=1', 'cancelled' ],
		[ '?page=jetpack-monetize', null ],
	] )( 'reads %s once, then removes it from the URL', ( search, result ) => {
		window.history.replaceState( null, '', `/wp-admin/admin.php${ search }` );

		expect( takeStripeReturn() ).toBe( result );
		expect( window.location.search ).toBe( '?page=jetpack-monetize' );
	} );
} );
