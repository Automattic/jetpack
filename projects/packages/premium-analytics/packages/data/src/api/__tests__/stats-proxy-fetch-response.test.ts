/**
 * The fetch boundary branches on `instanceof Response`, so it needs the real
 * WHATWG `Response`. The shared jsdom environment does not provide one, and
 * `window` is unavailable here — hence the script-data mock below.
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
import { fetchReport, fetchStatsProxy } from '../stats-proxy-fetch';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => undefined,
	isSimpleSite: () => false,
} ) );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function jsonResponse( body: unknown, status: number ): Response {
	return new Response( JSON.stringify( body ), {
		status,
		headers: { 'Content-Type': 'application/json' },
	} );
}

/**
 * Make apiFetch behave the way its own chain does under `parse: false`: resolve
 * the raw `Response` for a 2xx and reject with the raw `Response` for a non-2xx
 * (see `parseAndThrowError` in `@wordpress/api-fetch`). Error tests that resolve
 * a failed response instead would exercise a branch the real chain never reaches.
 *
 * @param response - The response apiFetch should reply with.
 */
function respondWith( response: Response ) {
	mockApiFetch.mockImplementation( () =>
		response.ok ? Promise.resolve( response ) : Promise.reject( response )
	);
}

function request() {
	return fetchStatsProxy( { version: '1.1', endpoint: 'stats/top-posts' } );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'fetchStatsProxy response handling', () => {
	it( 'requests without apiFetch parsing so the Response survives', async () => {
		respondWith( jsonResponse( { ok: true }, 200 ) );

		await request();

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'attaches the HTTP status to a rejected non-2xx error body', async () => {
		respondWith( jsonResponse( { error: 'unauthorized', message: 'Nope.' }, 401 ) );

		await expect( request() ).rejects.toEqual( {
			error: 'unauthorized',
			message: 'Nope.',
			status: 401,
		} );
	} );

	it.each( [ 502, 503, 504 ] )( 'attaches a %d server status', async status => {
		respondWith( jsonResponse( { error: 'api_error', message: 'Upstream.' }, status ) );

		await expect( request() ).rejects.toMatchObject( { status } );
	} );

	it( 'keeps the status when a non-2xx body is not JSON (gateway HTML/text)', async () => {
		// A 502/503/504 page is commonly HTML; parsing throws invalid_json, but
		// the status must still reach the server-error UI and the retry guard.
		respondWith( new Response( '<html>502 Bad Gateway</html>', { status: 502 } ) );

		await expect( request() ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
			status: 502,
		} );
	} );

	it( 'does not overwrite a status the body already provides at the top level', async () => {
		respondWith( jsonResponse( { code: 'rest_forbidden', status: 403 }, 500 ) );

		await expect( request() ).rejects.toEqual( { code: 'rest_forbidden', status: 403 } );
	} );

	it( 'leaves a WP_Error data.status alone while adding the top-level status', async () => {
		respondWith(
			jsonResponse( { code: 'rest_forbidden', message: 'Sorry.', data: { status: 403 } }, 403 )
		);

		await expect( request() ).rejects.toEqual( {
			code: 'rest_forbidden',
			message: 'Sorry.',
			data: { status: 403 },
			status: 403,
		} );
	} );

	it( 'throws a non-object JSON error body as-is without attaching status', async () => {
		// `isPlainErrorBody` exists so `status` is never spread into arrays,
		// strings, or null — spreading an array would mangle it into an object.
		respondWith( jsonResponse( [ 'boom' ], 500 ) );

		await expect( request() ).rejects.toEqual( [ 'boom' ] );
	} );

	it( 'throws a JSON string error body as-is', async () => {
		respondWith( jsonResponse( 'boom', 502 ) );

		await expect( request() ).rejects.toBe( 'boom' );
	} );

	it( 'rethrows a non-Response rejection untouched (offline / fetch / abort)', async () => {
		// apiFetch rejects offline and network failures with a bare
		// `{ code, message }` and no Response; there is no status to add.
		const offline = { code: 'offline_error', message: 'Unable to connect.' };
		mockApiFetch.mockRejectedValue( offline );

		await expect( request() ).rejects.toBe( offline );
	} );

	it( 'returns null for a 204 response', async () => {
		respondWith( new Response( null, { status: 204 } ) );

		await expect( request() ).resolves.toBeNull();
	} );

	it( 'parses a successful JSON response', async () => {
		respondWith( jsonResponse( { ok: true }, 200 ) );

		await expect( request() ).resolves.toEqual( { ok: true } );
	} );

	it( 'throws the invalid_json shape when a successful body is not JSON', async () => {
		respondWith( new Response( 'not json', { status: 200 } ) );

		await expect( request() ).rejects.toEqual( {
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		} );
	} );

	it( 'returns an already-parsed value from a short-circuiting middleware unchanged', async () => {
		// Storybook's report mocks resolve plain data regardless of `parse`, so a
		// resolved value that is not a `Response` must pass straight through.
		const mocked = { data: [ 1, 2, 3 ] };
		mockApiFetch.mockResolvedValue( mocked );

		await expect( request() ).resolves.toBe( mocked );
	} );
} );

describe( 'fetchReport response handling', () => {
	it( 'attaches the HTTP status to a failed report request', async () => {
		respondWith( jsonResponse( { error: 'api_error', message: 'Upstream.' }, 502 ) );

		await expect( fetchReport( 'orders/by-date' ) ).rejects.toEqual( {
			error: 'api_error',
			message: 'Upstream.',
			status: 502,
		} );
	} );

	it( 'parses a successful report response', async () => {
		respondWith( jsonResponse( { data: [], summary: {} }, 200 ) );

		await expect( fetchReport( 'orders/by-date' ) ).resolves.toEqual( {
			data: [],
			summary: {},
		} );
	} );
} );
