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
			api: 'wpcom/v2' as const,
			path: 'memberships/subscriptions/1/cancel',
			method: 'POST' as const,
			data: { user_id: 2 },
		};

		expect( toFetchOptions( request, false ) ).toEqual( {
			path: '/jetpack/v4/monetize/wpcom/v2/memberships/subscriptions/1/cancel',
			method: 'POST',
			data: { user_id: 2 },
		} );
	} );
} );

describe( 'rejectBodyError', () => {
	it.each( [
		[ 'a string', { error: 'Stripe is not connected.' }, 'error', 'Stripe is not connected.' ],
		[ 'an object', { error: { code: 'no_plan', message: 'No plan.' } }, 'no_plan', 'No plan.' ],
	] )( 'throws on %s error under a success status', ( _kind, body, code, message ) => {
		expect( () => rejectBodyError( body ) ).toThrow( new WpcomApiError( code, message ) );
		expect( () => rejectBodyError( body ) ).toThrow(
			expect.objectContaining( { code, status: 200 } )
		);
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
			403,
		],
		[ 'a thrown Error', new Error( 'Boom.' ), 'error', 'Boom.', undefined ],
		[
			'an error status with the error nested',
			{ error: { code: 'validation_error', message: 'Taken.' } },
			'validation_error',
			'Taken.',
			undefined,
		],
		[
			'a nested error with its status beside it',
			{ error: { code: 'no_coupons', message: 'Not enabled.' }, data: { status: 403 } },
			'no_coupons',
			'Not enabled.',
			403,
		],
		[
			'a string error code',
			{ error: 'unauthorized', message: 'Not allowed.' },
			'unauthorized',
			'Not allowed.',
			undefined,
		],
	] )( 'wraps %s', ( _kind, rejection, code, message, status ) => {
		const error = toWpcomApiError( rejection );

		expect( error ).toBeInstanceOf( WpcomApiError );
		expect( error ).toMatchObject( { code, message, status } );
	} );
} );
