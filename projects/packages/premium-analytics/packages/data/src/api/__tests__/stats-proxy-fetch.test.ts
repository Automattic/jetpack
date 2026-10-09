/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { fetchReport, fetchStatsProxy } from '../stats-proxy-fetch';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function setSimpleScriptData( blogId = 191664832 ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: {
			site: {
				host: 'wpcom',
				wpcom: {
					blog_id: blogId,
				},
			},
		},
	} );
}

describe( 'fetchStatsProxy request path', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {} );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	const requestedPath = async ( params: Parameters< typeof fetchStatsProxy >[ 0 ] ) => {
		await fetchStatsProxy( params );
		return mockApiFetch.mock.calls[ 0 ][ 0 ].path;
	};

	it( 'preserves comma-separated UTM endpoint segments', async () => {
		await expect(
			requestedPath( {
				version: '1.1',
				endpoint: 'stats/utm/utm_source,utm_medium',
				params: { period: 'month' },
			} )
		).resolves.toBe(
			'/jetpack-premium-analytics/v1/proxy/v1.1/stats/utm/utm_source,utm_medium?period=month'
		);
	} );

	it( 'omits nullish query params', async () => {
		await expect(
			requestedPath( {
				version: '1.1',
				endpoint: 'stats/visits',
				params: {
					period: 'day',
					date: undefined,
					start_date: null,
				} as never,
			} )
		).resolves.toBe( '/jetpack-premium-analytics/v1/proxy/v1.1/stats/visits?period=day' );
	} );

	it( 'does not overwrite an explicit site query on Simple global requests', async () => {
		setSimpleScriptData( 67890 );

		await expect(
			requestedPath( {
				version: '1.2',
				endpoint: '/upgrades',
				params: { site: 41 },
				global: true,
			} )
		).resolves.toBe( '/rest/v1.2/upgrades?site=41' );
	} );

	it( 'does not scope a request as global on Simple without opting in', async () => {
		setSimpleScriptData( 67890 );

		// No `global: true` — treated as an ordinary site-scoped request even
		// though the endpoint name is `upgrades`, since the resolver no longer
		// infers `global` from the endpoint string.
		await expect( requestedPath( { version: '1.2', endpoint: '/upgrades' } ) ).resolves.toBe(
			'/rest/v1.2/upgrades'
		);
	} );

	it( 'throws for a Simple global request with no site to scope to', async () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { site: { host: 'wpcom' } },
		} );

		await expect(
			fetchStatsProxy( { version: '1.2', endpoint: '/upgrades', global: true } )
		).rejects.toThrow( /has no site to scope to/ );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'does not require a site for a non-Simple global request', async () => {
		// Local proxy path is unaffected by `global` — the flag only changes
		// Simple's public-api dispatch, so a missing blog id shouldn't throw here.
		await expect(
			requestedPath( { version: '1.2', endpoint: '/upgrades', global: true } )
		).resolves.toBe( '/jetpack-premium-analytics/v1/proxy/v1.2/upgrades' );
	} );
} );

describe( 'fetchStatsProxy', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {} );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'uses GET by default and omits request data', async () => {
		await fetchStatsProxy( {
			version: '1.1',
			endpoint: 'stats/top-posts',
			params: { period: 'day' },
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts?period=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'sends POST bodies as apiFetch data', async () => {
		const body = { modules: [ 'visits' ] };

		await fetchStatsProxy( {
			version: '2',
			endpoint: 'jetpack-stats-dashboard/modules',
			method: 'POST',
			body,
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats-dashboard/modules',
			method: 'POST',
			data: body,
			parse: false,
		} );
	} );

	it( 'uses WPCOM Simple paths directly before apiFetch middleware runs', async () => {
		setSimpleScriptData();

		await fetchStatsProxy( {
			version: '1.1',
			endpoint: 'stats/location-views/country',
			params: { max: 10, period: 'day' },
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.1/stats/location-views/country?max=10&period=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'builds report paths through the local proxy by default', async () => {
		await fetchReport( 'orders/by-date', {
			from: '2026-06-01',
			to: '2026-06-30',
			interval: 'day',
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/orders/by-date?from=2026-06-01&to=2026-06-30&interval=day',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'builds Simple report paths for the WPCOM apiFetch bridge', async () => {
		setSimpleScriptData();

		await fetchReport( 'sessions/by-device', { from: '2026-06-01', to: '2026-06-30' } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/analytics/reports/sessions/by-device?from=2026-06-01&to=2026-06-30',
			method: 'GET',
			parse: false,
		} );
	} );

	it( 'serializes nested report filters into query args', async () => {
		await fetchReport( 'coupons/by-date', {
			from: '2026-06-01',
			to: '2026-06-30',
			filters: [ { key: 'product', compare: 'IN', value: '42' } ],
		} );

		const path = ( mockApiFetch.mock.calls[ 0 ][ 0 ] as { path: string } ).path;
		expect( decodeURIComponent( path ) ).toBe(
			'/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/coupons/by-date?from=2026-06-01&to=2026-06-30&filters[0][key]=product&filters[0][compare]=IN&filters[0][value]=42'
		);
	} );

	it( 'marks WPCOM Simple upgrades requests as global when opted in', async () => {
		setSimpleScriptData( 67890 );

		await fetchStatsProxy( {
			version: '1.2',
			endpoint: 'upgrades',
			global: true,
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.2/upgrades?site=67890',
			method: 'GET',
			global: true,
			parse: false,
		} );
	} );
} );

// The jsdom environment has no `Response` constructor, so the double carries only what is read.
function fakeResponse( body: string, status: number ): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve().then( () => JSON.parse( body ) ),
	} as unknown as Response;
}

function jsonResponse( body: unknown, status: number ): Response {
	return fakeResponse( JSON.stringify( body ), status );
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

describe( 'fetchStatsProxy response handling', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'attaches the HTTP status to a rejected non-2xx error body', async () => {
		respondWith( jsonResponse( { error: 'unauthorized', message: 'Nope.' }, 401 ) );

		await expect( request() ).rejects.toEqual( {
			error: 'unauthorized',
			message: 'Nope.',
			status: 401,
		} );
	} );

	it( 'keeps the status when a non-2xx body is not JSON (gateway HTML/text)', async () => {
		// A 502/503/504 page is commonly HTML; parsing throws invalid_json, but
		// the status must still reach the server-error UI and the retry guard.
		respondWith( fakeResponse( '<html>502 Bad Gateway</html>', 502 ) );

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

	it( 'replays an expired nonce through apiFetch so its own recovery can run', async () => {
		// apiFetch refreshes the nonce and retries in its top-level catch, which
		// branches on `error.code` — under `parse: false` it only sees the raw
		// `Response`. Without the replay a stale nonce reads as a plain 403.
		const nonceError = jsonResponse(
			{ code: 'rest_cookie_invalid_nonce', message: 'Cookie check failed', data: { status: 403 } },
			403
		);
		mockApiFetch
			.mockImplementationOnce( () => Promise.reject( nonceError ) )
			.mockImplementationOnce( () => Promise.resolve( { ok: true } ) );

		await expect( request() ).resolves.toEqual( { ok: true } );

		// The replay drops `parse: false` so apiFetch parses — and recovers — itself.
		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts',
			method: 'GET',
		} );
	} );

	it( 'does not replay a 403 that is not a nonce failure', async () => {
		respondWith( jsonResponse( { error: 'unauthorized', message: 'Nope.' }, 403 ) );

		await expect( request() ).rejects.toEqual( {
			error: 'unauthorized',
			message: 'Nope.',
			status: 403,
		} );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns null for a 204 response', async () => {
		respondWith( fakeResponse( '', 204 ) );

		await expect( request() ).resolves.toBeNull();
	} );

	it( 'parses a successful JSON response', async () => {
		respondWith( jsonResponse( { ok: true }, 200 ) );

		await expect( request() ).resolves.toEqual( { ok: true } );
	} );

	it( 'throws the invalid_json shape when a successful body is not JSON', async () => {
		respondWith( fakeResponse( 'not json', 200 ) );

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
