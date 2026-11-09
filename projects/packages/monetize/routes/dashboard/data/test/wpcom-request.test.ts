import { WpcomApiError, rejectBodyError, toFetchOptions, toWpcomApiError } from '../wpcom-request';

describe( 'toFetchOptions', () => {
	it.each( [
		[ 'self-hosted', false, '/jetpack/v4/monetize/wpcom/v2/memberships/coupons?type=all' ],
		[ 'Simple', true, '/wpcom/v2/memberships/coupons?type=all' ],
	] )( 'routes a %s request', ( _host, isSimple, path ) => {
		const request = {
			api: 'wpcom/v2' as const,
			path: 'memberships/coupons',
			query: { type: 'all', page: undefined },
		};

		expect( toFetchOptions( request, isSimple ) ).toEqual( { path, method: 'GET' } );
	} );

	it( 'sends the method and body', () => {
		const request = {
			api: 'rest/v1.1' as const,
			path: 'wordads/settings',
			method: 'POST' as const,
			data: { paypal: 'a@example.com' },
		};

		expect( toFetchOptions( request, false ) ).toEqual( {
			path: '/jetpack/v4/monetize/rest/v1.1/wordads/settings',
			method: 'POST',
			data: { paypal: 'a@example.com' },
		} );
	} );
} );

describe( 'rejectBodyError', () => {
	it.each( [
		[ 'a string', { error: 'Stripe is not connected.' }, 'error', 'Stripe is not connected.' ],
		[ 'an object', { error: { code: 'no_plan', message: 'No plan.' } }, 'no_plan', 'No plan.' ],
	] )( 'throws on %s error under a success status', ( _kind, body, code, message ) => {
		expect( () => rejectBodyError( body ) ).toThrow( new WpcomApiError( code, message ) );
		expect( () => rejectBodyError( body ) ).toThrow( expect.objectContaining( { code } ) );
	} );

	it( 'passes a body with no error through', () => {
		const body = { products: [] };

		expect( rejectBodyError( body ) ).toBe( body );
	} );
} );

describe( 'toWpcomApiError', () => {
	it.each( [
		[
			"apiFetch's error object",
			{ code: 'rest_forbidden', message: 'Sorry.', data: { status: 403 } },
			'rest_forbidden',
			'Sorry.',
		],
		[ 'a thrown Error', new Error( 'Boom.' ), 'error', 'Boom.' ],
	] )( 'wraps %s', ( _kind, rejection, code, message ) => {
		const error = toWpcomApiError( rejection );

		expect( error ).toBeInstanceOf( WpcomApiError );
		expect( error ).toMatchObject( { code, message } );
	} );
} );
