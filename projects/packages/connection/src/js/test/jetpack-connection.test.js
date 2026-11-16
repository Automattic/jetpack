import { select } from '@wordpress/data';

describe( 'jetpack-connection script', () => {
	it( 'registers the connection store when it loads', () => {
		window.JP_CONNECTION_INITIAL_STATE = {};
		require( '../jetpack-connection' );

		expect( select( 'jetpack-connection' )?.getConnectionStatus ).toEqual( expect.any( Function ) );
	} );
} );
