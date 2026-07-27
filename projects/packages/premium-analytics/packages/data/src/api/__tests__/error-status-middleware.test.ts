/**
 * The middleware branches on `instanceof Response`, so it needs the real
 * WHATWG `Response`. The shared jsdom environment does not provide one.
 *
 * @jest-environment node
 */

/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	apiErrorStatusMiddleware,
	registerApiErrorStatusMiddleware,
} from '../error-status-middleware';

function jsonResponse( body: unknown, status: number ): Response {
	return new Response( JSON.stringify( body ), {
		status,
		headers: { 'Content-Type': 'application/json' },
	} );
}

/**
 * A `next` that behaves like apiFetch's own chain under `parse: false`: it
 * resolves the raw `Response` for a 2xx and rejects with the raw `Response`
 * for a non-2xx (see `parseAndThrowError` in `@wordpress/api-fetch`). Error
 * tests that resolve a failed response instead would exercise a branch the
 * real chain never reaches.
 */
function runResponse( response: Response, options: Record< string, unknown > = {} ) {
	const next = jest.fn( () =>
		response.ok ? Promise.resolve( response ) : Promise.reject( response )
	);
	return { next, result: apiErrorStatusMiddleware( { path: '/x', ...options }, next ) };
}

function runResolved( value: unknown, options: Record< string, unknown > = {} ) {
	const next = jest.fn().mockResolvedValue( value );
	return { next, result: apiErrorStatusMiddleware( { path: '/x', ...options }, next ) };
}

function runRejected( value: unknown, options: Record< string, unknown > = {} ) {
	const next = jest.fn().mockRejectedValue( value );
	return { next, result: apiErrorStatusMiddleware( { path: '/x', ...options }, next ) };
}

describe( 'apiErrorStatusMiddleware', () => {
	it( 'attaches the HTTP status to a rejected non-2xx error body', async () => {
		const { result } = runResponse(
			jsonResponse( { error: 'unauthorized', message: 'Nope.' }, 401 )
		);

		await expect( result ).rejects.toEqual( {
			error: 'unauthorized',
			message: 'Nope.',
			status: 401,
		} );
	} );

	it.each( [ 502, 503, 504 ] )( 'attaches a %d server status', async status => {
		const { result } = runResponse(
			jsonResponse( { error: 'api_error', message: 'Upstream.' }, status )
		);

		await expect( result ).rejects.toMatchObject( { status } );
	} );

	it( 'keeps the status when a non-2xx body is not JSON (gateway HTML/text)', async () => {
		// A 502/503/504 page is commonly HTML; parsing throws invalid_json, but
		// the status must still reach the server-error UI and the retry guard.
		const { result } = runResponse(
			new Response( '<html>502 Bad Gateway</html>', { status: 502 } )
		);

		await expect( result ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			status: 502,
		} );
	} );

	it( 'does not overwrite a status the body already provides at the top level', async () => {
		const { result } = runResponse( jsonResponse( { code: 'rest_forbidden', status: 403 }, 500 ) );

		await expect( result ).rejects.toEqual( { code: 'rest_forbidden', status: 403 } );
	} );

	it( 'leaves a WP_Error data.status alone while adding the top-level status', async () => {
		const { result } = runResponse(
			jsonResponse( { code: 'rest_forbidden', message: 'Sorry.', data: { status: 403 } }, 403 )
		);

		await expect( result ).rejects.toEqual( {
			code: 'rest_forbidden',
			message: 'Sorry.',
			data: { status: 403 },
			status: 403,
		} );
	} );

	it( 'throws a non-object JSON error body as-is without attaching status', async () => {
		// `isPlainErrorBody` exists so `status` is never spread into arrays,
		// strings, or null — spreading an array would mangle it into an object.
		const { result } = runResponse( jsonResponse( [ 'boom' ], 500 ) );

		await expect( result ).rejects.toEqual( [ 'boom' ] );
	} );

	it( 'throws a JSON string error body as-is', async () => {
		const { result } = runResponse( jsonResponse( 'boom', 502 ) );

		await expect( result ).rejects.toBe( 'boom' );
	} );

	it( 'rethrows a non-Response rejection untouched (offline / fetch / abort)', async () => {
		// apiFetch rejects offline and network failures with a bare
		// `{ code, message }` and no Response; there is no status to add.
		const offline = { code: 'offline_error', message: 'Unable to connect.' };
		const { result } = runRejected( offline );

		await expect( result ).rejects.toBe( offline );
	} );

	it( 'returns null for a 204 response', async () => {
		const { result } = runResponse( new Response( null, { status: 204 } ) );

		await expect( result ).resolves.toBeNull();
	} );

	it( 'parses a successful JSON response', async () => {
		const { result } = runResponse( jsonResponse( { ok: true }, 200 ) );

		await expect( result ).resolves.toEqual( { ok: true } );
	} );

	it( 'throws the invalid_json shape when a successful body is not JSON', async () => {
		const { result } = runResponse( new Response( 'not json', { status: 200 } ) );

		await expect( result ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'passes the raw Response through untouched when the caller set parse: false', async () => {
		const response = jsonResponse( { error: 'nope' }, 500 );
		const { next, result } = runResolved( response, { parse: false } );

		await expect( result ).resolves.toBe( response );
		expect( next ).toHaveBeenCalledWith( { path: '/x', parse: false } );
	} );

	it( 'returns a non-Response value from next() unchanged', async () => {
		const mocked = { data: [ 1, 2, 3 ] };
		const { result } = runResolved( mocked );

		await expect( result ).resolves.toBe( mocked );
	} );

	it( 'leaves unbounded per_page=-1 queries to apiFetch so fetchAllMiddleware still paginates', async () => {
		const mocked = [ { id: 1 } ];
		const { next, result } = runResolved( mocked, { path: '/wp/v2/thing?per_page=-1' } );

		await expect( result ).resolves.toBe( mocked );
		expect( next ).toHaveBeenCalledWith( { path: '/wp/v2/thing?per_page=-1' } );
	} );

	it( 'leaves unbounded per_page=-1 url-based queries to apiFetch as well', async () => {
		const url = 'https://example.com/wp-json/wp/v2/thing?per_page=-1';
		const mocked = [ { id: 1 } ];
		const { next, result } = runResolved( mocked, { url } );

		await expect( result ).resolves.toBe( mocked );
		expect( next ).toHaveBeenCalledWith( { path: '/x', url } );
	} );

	it( 'forces parse: false on the request it forwards', async () => {
		const { next } = runResponse( jsonResponse( { ok: true }, 200 ), { method: 'POST' } );

		await Promise.resolve();
		expect( next ).toHaveBeenCalledWith( { path: '/x', method: 'POST', parse: false } );
	} );
} );

describe( 'registerApiErrorStatusMiddleware', () => {
	it( 'registers with apiFetch only once across repeated calls', () => {
		const use = jest.spyOn( apiFetch, 'use' ).mockImplementation( () => {} );

		try {
			registerApiErrorStatusMiddleware();
			registerApiErrorStatusMiddleware();

			expect( use ).toHaveBeenCalledTimes( 1 );
			expect( use ).toHaveBeenCalledWith( apiErrorStatusMiddleware );
		} finally {
			use.mockRestore();
		}
	} );

	it( 'skips registration when the apiFetch instance exposes no use()', async () => {
		// Suites that mock `@wordpress/api-fetch` with a bare function get such an
		// instance, and this runs at module scope in the data package.
		await jest.isolateModulesAsync( async () => {
			const isolatedApiFetch = ( await import( '@wordpress/api-fetch' ) ).default as unknown as
				| Record< string, unknown >
				| undefined;
			const original = isolatedApiFetch?.use;
			delete isolatedApiFetch?.use;

			try {
				const middleware = await import( '../error-status-middleware' );

				expect( isolatedApiFetch?.use ).toBeUndefined();
				expect( () => middleware.registerApiErrorStatusMiddleware() ).not.toThrow();

				// Skipping must not latch: a later call on a usable instance still registers.
				const use = jest.fn();
				if ( isolatedApiFetch ) {
					isolatedApiFetch.use = use;
				}
				middleware.registerApiErrorStatusMiddleware();

				expect( use ).toHaveBeenCalledWith( middleware.apiErrorStatusMiddleware );
			} finally {
				if ( isolatedApiFetch ) {
					isolatedApiFetch.use = original;
				}
			}
		} );
	} );
} );
