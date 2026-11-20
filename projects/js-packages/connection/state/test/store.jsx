import { jest } from '@jest/globals';
import { dispatch } from '@wordpress/data';

window.JP_CONNECTION_INITIAL_STATE = {
	apiRoot: 'https://example.org/wp-json/',
	apiNonce: 'initial-state-nonce',
};

const { STORE_ID } = await import( '../store' );

describe( 'connection store', () => {
	afterEach( () => {
		delete window.fetch;
	} );

	test( 'sends requests to the initial-state API root before any component configures the client', async () => {
		const fetch = jest.fn().mockResolvedValue( { status: 200, json: async () => ( {} ) } );
		window.fetch = fetch;

		await dispatch( STORE_ID ).registerSite( { redirectUri: 'admin.php' } );

		expect( fetch ).toHaveBeenCalledWith(
			'https://example.org/wp-json/jetpack/v4/connection/register',
			expect.objectContaining( {
				headers: expect.objectContaining( { 'X-WP-Nonce': 'initial-state-nonce' } ),
			} )
		);
	} );
} );
