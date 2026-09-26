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
} );
