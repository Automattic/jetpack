/**
 * The middleware branches on `instanceof Response`, so it needs the real
 * WHATWG `Response`. The shared jsdom environment does not provide one.
 *
 * @jest-environment node
 */

/**
 * Internal dependencies
 */
import { apiErrorStatusMiddleware } from '../error-status-middleware';

function jsonResponse( body: unknown, status: number ): Response {
	return new Response( JSON.stringify( body ), {
		status,
		headers: { 'Content-Type': 'application/json' },
	} );
}

function run( response: unknown, options: Record< string, unknown > = {} ) {
	const next = jest.fn().mockResolvedValue( response );
	return { next, result: apiErrorStatusMiddleware( { path: '/x', ...options }, next ) };
}

describe( 'apiErrorStatusMiddleware', () => {
	it( 'attaches the HTTP status to a non-2xx error body', async () => {
		const { result } = run( jsonResponse( { error: 'unauthorized', message: 'Nope.' }, 401 ) );

		await expect( result ).rejects.toEqual( {
			error: 'unauthorized',
			message: 'Nope.',
			status: 401,
		} );
	} );

	it.each( [ 502, 503, 504 ] )( 'attaches a %d server status', async status => {
		const { result } = run( jsonResponse( { error: 'api_error', message: 'Upstream.' }, status ) );

		await expect( result ).rejects.toMatchObject( { status } );
	} );

	it( 'does not overwrite a status the body already provides at the top level', async () => {
		const { result } = run( jsonResponse( { code: 'rest_forbidden', status: 403 }, 500 ) );

		await expect( result ).rejects.toEqual( { code: 'rest_forbidden', status: 403 } );
	} );

	it( 'leaves a WP_Error data.status alone while adding the top-level status', async () => {
		const { result } = run(
			jsonResponse( { code: 'rest_forbidden', message: 'Sorry.', data: { status: 403 } }, 403 )
		);

		await expect( result ).rejects.toEqual( {
			code: 'rest_forbidden',
			message: 'Sorry.',
			data: { status: 403 },
			status: 403,
		} );
	} );

	it( 'returns null for a 204 response', async () => {
		const { result } = run( new Response( null, { status: 204 } ) );

		await expect( result ).resolves.toBeNull();
	} );

	it( 'parses a successful JSON response', async () => {
		const { result } = run( jsonResponse( { ok: true }, 200 ) );

		await expect( result ).resolves.toEqual( { ok: true } );
	} );

	it( 'throws the invalid_json shape when a successful body is not JSON', async () => {
		const { result } = run( new Response( 'not json', { status: 200 } ) );

		await expect( result ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'throws the invalid_json shape when an error body is not JSON', async () => {
		const { result } = run( new Response( '<html>500</html>', { status: 500 } ) );

		await expect( result ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'passes the raw Response through untouched when the caller set parse: false', async () => {
		const response = jsonResponse( { error: 'nope' }, 500 );
		const { next, result } = run( response, { parse: false } );

		await expect( result ).resolves.toBe( response );
		expect( next ).toHaveBeenCalledWith( { path: '/x', parse: false } );
	} );

	it( 'returns a non-Response value from next() unchanged', async () => {
		const mocked = { data: [ 1, 2, 3 ] };
		const { result } = run( mocked );

		await expect( result ).resolves.toBe( mocked );
	} );

	it( 'leaves unbounded per_page=-1 queries to apiFetch so fetchAllMiddleware still paginates', async () => {
		const mocked = [ { id: 1 } ];
		const { next, result } = run( mocked, { path: '/wp/v2/thing?per_page=-1' } );

		await expect( result ).resolves.toBe( mocked );
		expect( next ).toHaveBeenCalledWith( { path: '/wp/v2/thing?per_page=-1' } );
	} );

	it( 'forces parse: false on the request it forwards', async () => {
		const { next } = run( jsonResponse( { ok: true }, 200 ), { method: 'POST' } );

		await Promise.resolve();
		expect( next ).toHaveBeenCalledWith( { path: '/x', method: 'POST', parse: false } );
	} );
} );
