/**
 * Internal dependencies
 */
import { viewerCountryQuery } from '../viewer-country-query';

// jsdom has no `fetch`, so there is nothing for `jest.spyOn()` to wrap.
function mockGeoResponse( body: unknown, ok = true ) {
	// eslint-disable-next-line jest/prefer-spy-on
	globalThis.fetch = jest.fn().mockResolvedValue( { ok, json: async () => body } );
}

async function run() {
	const { queryFn } = viewerCountryQuery();
	return ( queryFn as () => Promise< string | null > )();
}

describe( 'viewerCountryQuery', () => {
	afterEach( () => {
		delete ( globalThis as { fetch?: unknown } ).fetch;
		jest.restoreAllMocks();
	} );

	it( 'returns the upper-case country code from the geo lookup', async () => {
		mockGeoResponse( { country_short: 'in' } );

		await expect( run() ).resolves.toBe( 'IN' );
	} );

	it( 'returns null instead of a value that is not a two-letter country code', async () => {
		mockGeoResponse( { country_short: '-' } );

		await expect( run() ).resolves.toBeNull();
	} );

	it( 'returns null when the geo lookup fails', async () => {
		mockGeoResponse( { country_short: 'IN' }, false );

		await expect( run() ).resolves.toBeNull();
	} );

	it( 'returns null when the geo request cannot be made', async () => {
		// eslint-disable-next-line jest/prefer-spy-on
		globalThis.fetch = jest.fn().mockRejectedValue( new TypeError( 'Failed to fetch' ) );

		await expect( run() ).resolves.toBeNull();
	} );

	it( 'gives up on a geo request that does not answer in time', async () => {
		// Stand in for the timeout firing, so the test does not wait it out.
		jest
			.spyOn( AbortSignal, 'timeout' )
			.mockReturnValue( AbortSignal.abort( new DOMException( 'Timed out', 'TimeoutError' ) ) );
		// eslint-disable-next-line jest/prefer-spy-on
		globalThis.fetch = jest.fn(
			( _url: string, { signal }: RequestInit ) =>
				new Promise( ( _resolve, reject ) => {
					if ( signal?.aborted ) {
						reject( signal.reason );
					}
					signal?.addEventListener( 'abort', () => reject( signal.reason ) );
				} )
		);

		await expect( run() ).resolves.toBeNull();
	} );
} );
