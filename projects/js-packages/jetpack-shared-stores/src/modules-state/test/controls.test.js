import apiFetch from '@wordpress/api-fetch';
import controls, { FETCH_JETPACK_MODULES, UPDATE_JETPACK_MODULE_STATUS } from '../controls';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'controls', () => {
	// Some tests ignore the returned promise, so a rejecting mock must not outlive its test.
	afterEach( () => {
		apiFetch.mockReset();
	} );

	test( 'should fetch jetpack modules', () => {
		const expectedPath = '/jetpack/v4/module/all';
		const expectedMethod = 'GET';

		controls[ FETCH_JETPACK_MODULES ]();

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: expectedPath,
			method: expectedMethod,
		} );
	} );

	test( 'should update jetpack module status', () => {
		const settings = {
			name: 'test-module',
			active: true,
		};
		const expectedPath = `/jetpack/v4/module/${ settings.name }/active`;
		const expectedMethod = 'POST';
		const expectedData = {
			active: settings.active,
		};

		controls[ UPDATE_JETPACK_MODULE_STATUS ]( { settings } );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: expectedPath,
			method: expectedMethod,
			data: expectedData,
		} );
	} );

	describe( 'when fetching the modules fails', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		test.each( [
			[ 'a 429 with a JSON body', { code: 'rate_limited', data: { status: 429 } } ],
			[ 'a 429 without a JSON body', { code: 'invalid_json' } ],
		] )( 'retries %s after one, then two seconds', async ( _, error ) => {
			const data = { stats: { activated: true } };
			apiFetch
				.mockRejectedValueOnce( error )
				.mockRejectedValueOnce( error )
				.mockResolvedValue( data );

			const result = controls[ FETCH_JETPACK_MODULES ]();
			await jest.advanceTimersByTimeAsync( 999 );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			await jest.advanceTimersByTimeAsync( 1 );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			await jest.advanceTimersByTimeAsync( 1999 );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			await jest.advanceTimersByTimeAsync( 1 );

			await expect( result ).resolves.toBe( data );
			expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'retries an HTML error page, which apiFetch reports only as invalid JSON', async () => {
			const data = { stats: { activated: true } };
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no fetch to spy on.
			globalThis.fetch = jest
				.fn()
				.mockResolvedValueOnce( { ok: false, status: 503, text: async () => '<html>Error</html>' } )
				.mockResolvedValueOnce( {
					ok: true,
					status: 200,
					text: async () => JSON.stringify( data ),
				} );
			apiFetch.mockImplementation( jest.requireActual( '@wordpress/api-fetch' ).default );

			try {
				const result = controls[ FETCH_JETPACK_MODULES ]();
				await jest.advanceTimersByTimeAsync( 1000 );

				await expect( result ).resolves.toEqual( data );
				expect( globalThis.fetch ).toHaveBeenCalledTimes( 2 );
			} finally {
				delete globalThis.fetch;
			}
		} );

		test( 'rejects with the error once both retries are rate-limited too', async () => {
			const error = { code: 'invalid_json' };
			apiFetch.mockRejectedValue( error );

			const result = controls[ FETCH_JETPACK_MODULES ]().catch( e => e );
			await jest.advanceTimersByTimeAsync( 3000 );

			await expect( result ).resolves.toBe( error );
			expect( apiFetch ).toHaveBeenCalledTimes( 3 );
		} );

		test( 'does not retry a JSON error other than a 429', async () => {
			const error = { code: 'rest_no_route', data: { status: 404 } };
			apiFetch.mockRejectedValue( error );

			await expect( controls[ FETCH_JETPACK_MODULES ]() ).rejects.toBe( error );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
