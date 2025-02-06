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

	this.mockResolvedValueOnce( {
		body: rbody,
		ok: status < 300,
		status: status,
		statusText: statusText,
		json: () => Promise.resolve( JSON.parse( rbody ) ),
	} );
};
beforeEach( () => {
	global.fetch.mockReset().mockReturnValue();
} );

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
} );
