import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

type Request = { path: string; method?: string };

const mockApiFetch = jest.fn< ( options: Request ) => Promise< unknown > >();
const saveCode = jest.fn< ( code: string ) => Promise< void > >();

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@automattic/request-external-access', () => ( {
	default: ( _url: string, callback: ( result: { keyring_id: number } ) => void ) =>
		callback( { keyring_id: 7 } ),
} ) );
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		seo: { google_verify: { connect_url: 'https://example.com/connect', is_connected: true } },
	} ),
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createInfoNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );

const { useGoogleVerify } = await import( '../use-google-verify' );

describe( 'useGoogleVerify', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		saveCode.mockResolvedValue( undefined );
	} );

	it.each( [
		[ 'saves the token through the settings form', false, [ [ 'tok' ] ] ],
		[ 'saves nothing when the site is already verified', true, [] ],
	] )( '%s', async ( _label, alreadyVerified, calls ) => {
		mockApiFetch.mockImplementation( ( { path, method } ) =>
			Promise.resolve(
				method === 'POST'
					? {}
					: {
							verified: alreadyVerified && path.endsWith( '/7' ),
							is_owner: true,
							google_search_console_url: '',
							token: 'tok',
						}
			)
		);
		const { result } = renderHook( () => useGoogleVerify( { saveCode } ) );
		await waitFor( () => expect( result.current.state ).not.toBe( 'loading' ) );

		act( () => result.current.autoVerify() );

		await waitFor( () => expect( result.current.isVerifying ).toBe( false ) );
		expect( saveCode.mock.calls ).toEqual( calls );
		expect( mockApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/settings' } )
		);
	} );
} );
