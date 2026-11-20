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

		// `type: string` on the endpoint rejects a null `from` with a 400, so only a given one is sent.
		it.each( [
			[
				'sends a given from',
				'connection_safe_mode_notice',
				{ from: 'connection_safe_mode_notice' },
			],
			[ 'leaves out a null from', null, {} ],
		] )( 'startIDCFresh %s', async ( _, from, expectedFrom ) => {
			fetch.mockFetchResponse(
				JSON.stringify( 'https://jetpack.wordpress.com/jetpack.authorize/1/' )
			);
			await restApi.startIDCFresh( 'admin.php?page=jetpack', from );
			expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ) ).toEqual( {
				redirect_uri: 'admin.php?page=jetpack',
				...expectedFrom,
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
