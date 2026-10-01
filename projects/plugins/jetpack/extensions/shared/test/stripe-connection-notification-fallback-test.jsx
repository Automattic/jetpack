// Separate file so the module loads fresh with no stored origin block.
import { select } from '@wordpress/data';

test( 'shows the editor-wide notice when no block was stored', () => {
	window.history.pushState( {}, '', '/?stripe_connect_cancelled=1' );
	require( '../stripe-connection-notification' );

	expect( select( 'core/notices' ).getNotices() ).toEqual( [
		expect.objectContaining( { status: 'error' } ),
	] );
} );
