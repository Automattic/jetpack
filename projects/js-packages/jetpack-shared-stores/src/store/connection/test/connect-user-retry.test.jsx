import restApi from '@automattic/jetpack-api';
import { dispatch, select } from '@wordpress/data';
import { initConnectionStore } from '../index';

const connectionStore = initConnectionStore();

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

		expect( select( connectionStore ).getUserConnectionError() ).toBe( false );

		await expect( dispatch( connectionStore ).connectUser( options ) ).rejects.toBe( error );
		expect( select( connectionStore ).getUserIsConnecting() ).toBe( false );
		expect( select( connectionStore ).getUserConnectionError() ).toBe( error );

		await dispatch( connectionStore ).connectUser( options );
		expect( fetchAuthorizationUrl ).toHaveBeenCalledTimes( 2 );
		expect( redirectFunc ).toHaveBeenCalledWith( authorizeUrl );
		expect( select( connectionStore ).getUserConnectionError() ).toBe( false );
	} );
} );
