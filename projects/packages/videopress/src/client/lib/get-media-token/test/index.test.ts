/**
 * Internal dependencies
 */
import getMediaToken from '../index';

declare const global: typeof globalThis & { fetch: jest.MockedFunction< typeof fetch > };

/**
 * Build a mock fetch response carrying the given admin-ajax token payload.
 *
 * @param {object} data - The `data` payload returned in the admin-ajax body.
 * @return {Response} A minimal Response-like object for the fetch mock.
 */
function mockResponse( data: Record< string, unknown > ): Response {
	return {
		ok: true,
		json: () => Promise.resolve( { success: true, data } ),
	} as unknown as Response;
}

/**
 * Read the URLSearchParams body passed to the first fetch call.
 *
 * @return {URLSearchParams} The request body.
 */
function requestBody(): URLSearchParams {
	return global.fetch.mock.calls[ 0 ][ 1 ].body as URLSearchParams;
}

describe( 'getMediaToken', () => {
	beforeEach( () => {
		localStorage.clear();
		/* jsdom doesn't define `fetch`, so assign a mock rather than spy on it. */
		// eslint-disable-next-line jest/prefer-spy-on
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'omits undefined params from the request body instead of serializing them as "undefined"', async () => {
		global.fetch.mockResolvedValue( mockResponse( { jwt: 'jwt-token' } ) );

		// `playback` sets `guid` from the args; without it the field is undefined.
		await getMediaToken( 'playback', { id: 5 } );

		const body = requestBody();
		expect( body ).toBeInstanceOf( URLSearchParams );
		expect( body.has( 'guid' ) ).toBe( false );
		expect( body.toString() ).not.toContain( 'undefined' );
		expect( body.get( 'action' ) ).toBe( 'videopress-get-playback-jwt' );
		expect( body.get( 'post_id' ) ).toBe( '5' );
		expect( body.get( 'subscription_plan_id' ) ).toBe( '0' );
	} );

	it( 'includes defined params, stringified', async () => {
		global.fetch.mockResolvedValue(
			mockResponse( {
				upload_token: 'tok',
				upload_blog_id: 'blog',
				upload_action_url: 'url',
			} )
		);

		await getMediaToken( 'upload', { filename: 'clip.mp4' } );

		const body = requestBody();
		expect( body.get( 'action' ) ).toBe( 'videopress-get-upload-token' );
		expect( body.get( 'filename' ) ).toBe( 'clip.mp4' );
	} );

	it( 'resolves a null token when the request rejects', async () => {
		global.fetch.mockRejectedValue( new Error( 'network down' ) );

		const result = await getMediaToken( 'upload' );

		expect( result ).toEqual( { token: null } );
	} );
} );
