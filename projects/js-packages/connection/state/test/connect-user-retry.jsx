import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { dispatch, select } from '@wordpress/data';
import { STORE_ID } from '../store';

describe( 'connectUser retry', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'fetches the authorization URL again after a failed attempt', async () => {
		const error = new Error( 'failed' );
		const authorizeUrl = 'https://authorize.url/';
		const fetchAuthorizationUrl = jest
			.spyOn( restApi, 'fetchAuthorizationUrl' )
			.mockRejectedValueOnce( error )
			.mockResolvedValueOnce( { authorizeUrl } );
		const redirectFunc = jest.fn();
		const options = { redirectFunc, redirectUri: 'REDIRECT_URI' };

		expect( select( STORE_ID ).getUserConnectionError() ).toBe( false );

		await expect( dispatch( STORE_ID ).connectUser( options ) ).rejects.toBe( error );
		expect( select( STORE_ID ).getUserIsConnecting() ).toBe( false );
		expect( select( STORE_ID ).getUserConnectionError() ).toBe( error );

		await dispatch( STORE_ID ).connectUser( options );
		expect( fetchAuthorizationUrl ).toHaveBeenCalledTimes( 2 );
		expect( redirectFunc ).toHaveBeenCalledWith( authorizeUrl );
		expect( select( STORE_ID ).getUserConnectionError() ).toBe( false );
	} );
} );
