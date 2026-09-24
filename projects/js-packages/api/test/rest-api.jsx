import { jest } from '@jest/globals';
import restApi from '../index';

// mock out some values to make testing easier
restApi.setApiRoot( '/fakeApiRoot/' );
restApi.setCacheBusterCallback( route => {
	const parts = route.split( '?' ),
		query = parts.length > 1 ? parts[ 1 ] : '',
		args = query.length ? query.split( '&' ) : [];

	args.push( '_cacheBuster=1234' );

	return parts[ 0 ] + '?' + args.join( '&' );
} );

// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
global.fetch = jest.fn();
fetch.mockFetchResponse = function ( body, init = {} ) {
	const status = parseInt( init.status || 200 );
	const statusText = init.statusText || 'OK';

	let rbody = body;
	if ( typeof rbody !== 'string' ) {
		rbody = JSON.stringify( rbody );
	}
	if ( status < 200 || status > 599 ) {
		throw new Error( `Invalid status: ${ init.status }` );
	}

	const makeResponse = () => ( {
		body: rbody,
		ok: status < 300,
		status: status,
		statusText: statusText,
		json: () => Promise.resolve( JSON.parse( rbody ) ),
		text: () => Promise.resolve( rbody ),
		clone: makeResponse,
	} );
	this.mockResolvedValueOnce( makeResponse() );
};
beforeEach( () => {
	global.fetch.mockReset().mockReturnValue();
	restApi.setApiNonce( undefined );
	delete globalThis.ajaxurl;
	delete globalThis.wp;
} );

const invalidNonce = {
	code: 'rest_cookie_invalid_nonce',
	message: 'Cookie check failed',
	data: { status: 403 },
};

describe( 'restApi', () => {
	describe( 'GET requests', () => {
		it( 'returns an object with methods', () => {
			expect( typeof restApi ).toBe( 'object' );
			expect( restApi.setApiRoot ).toBeInstanceOf( Function );
			expect( fetch ).not.toHaveBeenCalled();
		} );

		it( 'can fetchSiteConnectionStatus', async () => {
			fetch.mockFetchResponse( JSON.stringify( 'the body' ) );
			const connectionStatus = await restApi.fetchSiteConnectionStatus();
			expect( connectionStatus ).toBe( 'the body' );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( fetch ).toHaveBeenCalledWith(
				'/fakeApiRoot/jetpack/v4/connection?_cacheBuster=1234',
				{ credentials: 'same-origin', headers: { 'X-WP-Nonce': undefined } }
			);
		} );

		it( 'can post attachLicenses', async () => {
			fetch.mockFetchResponse( [ { activatedProductId: 1 } ] );
			const results = await restApi.attachLicenses();
			expect( results ).toEqual( [ { activatedProductId: 1 } ] );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( fetch ).toHaveBeenCalledWith( '/fakeApiRoot/jetpack/v4/licensing/attach-licenses', {
				body: '{}',
				credentials: 'same-origin',
				headers: { 'Content-type': 'application/json', 'X-WP-Nonce': undefined },
				method: 'post',
			} );
		} );

		it( 'can fetchBackupPreflightStatus', async () => {
			fetch.mockFetchResponse( { ok: true, tests: [] } );
			const preflightStatus = await restApi.fetchBackupPreflightStatus();
			expect( preflightStatus ).toEqual( { ok: true, tests: [] } );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( fetch ).toHaveBeenCalledWith(
				'/fakeApiRoot/jetpack/v4/site/backup/preflight?_cacheBuster=1234',
				{ credentials: 'same-origin', headers: { 'X-WP-Nonce': undefined } }
			);
		} );
	} );

	describe( 'stale nonce recovery', () => {
		beforeEach( () => {
			restApi.setApiNonce( 'stale' );
			globalThis.ajaxurl = '/wp-admin/admin-ajax.php';
		} );

		it( 'refreshes the nonce and retries a GET once', async () => {
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( 'fresh' );
			fetch.mockFetchResponse( { connected: true } );

			await expect( restApi.fetchSiteConnectionStatus() ).resolves.toEqual( { connected: true } );
			expect( fetch ).toHaveBeenCalledTimes( 3 );
			expect( fetch.mock.calls[ 1 ][ 0 ] ).toBe( '/wp-admin/admin-ajax.php?action=rest-nonce' );
			expect( fetch.mock.calls[ 2 ][ 1 ].headers ).toEqual( { 'X-WP-Nonce': 'fresh' } );
		} );

		it( 'keeps the refreshed nonce for later requests', async () => {
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( 'fresh' );
			fetch.mockFetchResponse( {} );
			fetch.mockFetchResponse( {} );

			await restApi.fetchSiteConnectionStatus();
			await restApi.fetchSiteConnectionStatus();
			expect( fetch ).toHaveBeenCalledTimes( 4 );
			expect( fetch.mock.calls[ 3 ][ 1 ].headers ).toEqual( { 'X-WP-Nonce': 'fresh' } );
		} );

		it( 'retries a POST with its body and prefers the api-fetch nonce endpoint', async () => {
			globalThis.wp = { apiFetch: { nonceEndpoint: '/custom-nonce-endpoint' } };
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( 'fresh' );
			fetch.mockFetchResponse( [] );

			await restApi.attachLicenses( [ 'abc' ] );
			expect( fetch.mock.calls[ 1 ][ 0 ] ).toBe( '/custom-nonce-endpoint' );
			expect( fetch.mock.calls[ 2 ][ 1 ] ).toEqual( {
				body: JSON.stringify( { licenses: [ 'abc' ] } ),
				credentials: 'same-origin',
				headers: { 'Content-type': 'application/json', 'X-WP-Nonce': 'fresh' },
				method: 'post',
			} );
		} );

		it( 'shares one nonce refresh between concurrent requests', async () => {
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( 'fresh' );
			fetch.mockFetchResponse( {} );
			fetch.mockFetchResponse( {} );

			await Promise.all( [
				restApi.fetchSiteConnectionStatus(),
				restApi.fetchSiteConnectionData(),
			] );
			const nonceCalls = fetch.mock.calls.filter( ( [ url ] ) => url.includes( 'rest-nonce' ) );
			expect( nonceCalls ).toHaveLength( 1 );
			expect( fetch ).toHaveBeenCalledTimes( 5 );
		} );

		it( 'surfaces the original error when the refresh fails', async () => {
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( '0', { status: 400 } );

			await expect( restApi.fetchSiteConnectionTest() ).rejects.toThrow(
				'Cookie check failed (Status 403)'
			);
			expect( fetch ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'retries only once', async () => {
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );
			fetch.mockFetchResponse( 'fresh' );
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );

			await expect( restApi.fetchSiteConnectionTest() ).rejects.toThrow( 'Cookie check failed' );
			expect( fetch ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'leaves other 403 errors alone', async () => {
			fetch.mockFetchResponse(
				{ code: 'rest_forbidden', message: 'Sorry, you are not allowed to do that.' },
				{ status: 403 }
			);

			await expect( restApi.fetchSiteConnectionTest() ).rejects.toThrow( 'Sorry' );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not retry without a nonce endpoint', async () => {
			delete globalThis.ajaxurl;
			fetch.mockFetchResponse( invalidNonce, { status: 403 } );

			await expect( restApi.fetchSiteConnectionTest() ).rejects.toThrow( 'Cookie check failed' );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
