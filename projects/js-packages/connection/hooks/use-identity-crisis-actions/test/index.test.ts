import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const migrateIDC = jest.fn< () => Promise< unknown > >();
const startIDCFresh = jest.fn< ( redirectUri?: string, from?: string ) => Promise< unknown > >();
const confirmIDCSafeMode = jest.fn< () => Promise< unknown > >();
const errorClass = ( name: string ) =>
	class extends Error {
		name = name;
	};
const clientErrors = {
	FetchNetworkError: errorClass( 'FetchNetworkError' ),
	JsonParseError: errorClass( 'JsonParseError' ),
	JsonParseAfterRedirectError: errorClass( 'JsonParseAfterRedirectError' ),
	Api404Error: errorClass( 'Api404Error' ),
	Api404AfterRedirectError: errorClass( 'Api404AfterRedirectError' ),
};
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { migrateIDC, startIDCFresh, confirmIDCSafeMode },
} ) );
const recordEvent = jest.fn< ( event: string, props: Record< string, unknown > ) => void >();
jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent } },
} ) );

const useIdentityCrisisActions = ( await import( '../index' ) ).default;
const { getIdentityCrisisErrorCause, getIdentityCrisisErrorCode } =
	await import( '../get-error-cause' );

/**
 * An error shaped like the client's `ApiError`, which carries the REST error body.
 *
 * @param code   - The REST error code.
 * @param status - The HTTP status.
 * @return The error.
 */
function apiError( code: string, status: number ): Error {
	return Object.assign( new Error( code ), {
		name: 'ApiError',
		response: { code, data: { status } },
	} );
}

/** Each method's `action` in the events, and its start event's suffix. */
const EVENT_ACTIONS = {
	migrate: 'migrate',
	startFresh: 'start_fresh',
	confirmSafeMode: 'confirm_safe_mode',
} as const;

describe( 'useIdentityCrisisActions', () => {
	beforeEach( () => {
		migrateIDC.mockReset();
		startIDCFresh.mockReset();
		confirmIDCSafeMode.mockReset();
		recordEvent.mockReset();
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'migrate', {}, migrateIDC, {} ],
		[
			'startFresh',
			{ new_blog_id: 456 },
			startIDCFresh,
			'https://jetpack.wordpress.com/jetpack.authorize/1/?client_id=456&from=connection_safe_mode',
		],
		[ 'startFresh', {}, startIDCFresh, 'https://jetpack.wordpress.com/jetpack.authorize/1/' ],
		[ 'confirmSafeMode', {}, confirmIDCSafeMode, {} ],
	] as const )(
		'records %s starting before its request, then its success, adding %j',
		async ( method, successProps, request, response ) => {
			// Start fresh's `new_blog_id` must come from the connect URL, not this old blog id.
			window.JetpackScriptData = {
				site: { wpcom: { blog_id: 123 } },
			} as typeof window.JetpackScriptData;
			request.mockResolvedValue( response );
			const { result } = renderHook( () =>
				useIdentityCrisisActions( { context: 'my-jetpack', isDevelopmentSite: false } )
			);

			await act( async () => {
				await result.current[ method ]( { entry: 'main', path: 'copyof>yes' } );
			} );

			const props = {
				path: 'copyof>yes',
				is_development_site: false,
				screen_version: 2,
				placement: 'page_modal',
				context: 'my-jetpack',
				blog_id: 123,
			};
			expect( recordEvent.mock.calls ).toStrictEqual( [
				[ `jetpack_idc_${ EVENT_ACTIONS[ method ] }`, props ],
				[
					'jetpack_idc_action_success',
					{ action: EVENT_ACTIONS[ method ], ...props, use_beacon: true, ...successProps },
				],
			] );
			expect( recordEvent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
				request.mock.invocationCallOrder[ 0 ]
			);
		}
	);

	it( 'reports Migrate as busy until it succeeds, then as migrated', async () => {
		let resolve: ( value: unknown ) => void = () => {};
		migrateIDC.mockReturnValue( new Promise( r => ( resolve = r ) ) );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		let pending: Promise< boolean > = Promise.resolve( false );
		act( () => {
			pending = result.current.migrate();
		} );
		expect( result.current.busyAction ).toBe( 'migrate' );

		await act( async () => {
			resolve( {} );
			await expect( pending ).resolves.toBe( true );
		} );
		expect( result.current.busyAction ).toBeNull();
		expect( result.current.isMigrated ).toBe( true );
	} );

	const nonce = 'rest_cookie_invalid_nonce';
	it.each( [
		[ 'migrate', nonce, 'migrate', false, apiError( nonce, 403 ), 'session', nonce ],
		[
			'confirmSafeMode',
			nonce,
			'confirm-safe-mode',
			false,
			apiError( nonce, 403 ),
			'session',
			nonce,
		],
		[ 'startFresh', nonce, 'start-fresh', null, apiError( nonce, 403 ), 'session', nonce ],
		[ 'migrate', 'unknown', 'migrate', false, new Error( 'boom' ), 'server', undefined ],
		[
			'migrate',
			'other',
			'migrate',
			false,
			apiError( '<b>Fatal</b>', 500 ),
			'server',
			'<b>Fatal</b>',
		],
	] as const )(
		'records %s failing with error_code %s',
		async ( method, errorCode, action, failed, rejection, cause, code ) => {
			migrateIDC.mockRejectedValue( rejection );
			confirmIDCSafeMode.mockRejectedValue( rejection );
			startIDCFresh.mockRejectedValue( rejection );
			const { result } = renderHook( () => useIdentityCrisisActions() );

			await act( async () => {
				await expect(
					result.current[ method ]( { entry: 'main', path: 'original>safe' } )
				).resolves.toBe( failed );
			} );

			expect( result.current.error ).toEqual( { action, cause, code } );
			expect( result.current.busyAction ).toBeNull();
			expect( result.current.isMigrated ).toBe( false );
			const props = { path: 'original>safe', screen_version: 2, context: null };
			expect( recordEvent.mock.calls ).toStrictEqual( [
				[ `jetpack_idc_${ EVENT_ACTIONS[ method ] }`, props ],
				[
					'jetpack_idc_action_error',
					{
						action: EVENT_ACTIONS[ method ],
						...props,
						error_code: errorCode,
						error_cause: cause,
					},
				],
			] );
		}
	);

	it( 'sends no second request while an action is in flight', async () => {
		let resolve: ( value: unknown ) => void = () => {};
		migrateIDC.mockReturnValue( new Promise( r => ( resolve = r ) ) );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		let first: Promise< boolean > = Promise.resolve( false );
		let second: Promise< boolean > = Promise.resolve( true );
		act( () => {
			first = result.current.migrate();
			second = result.current.migrate();
		} );

		await act( async () => {
			resolve( {} );
			await expect( first ).resolves.toBe( true );
			await expect( second ).resolves.toBe( false );
		} );
		expect( migrateIDC ).toHaveBeenCalledTimes( 1 );
		expect( result.current.error ).toBeNull();
		expect( recordEvent.mock.calls.map( ( [ event ] ) => event ) ).toEqual( [
			'jetpack_idc_migrate',
			'jetpack_idc_action_success',
		] );
	} );

	it( 'returns the connect URL from Start fresh and stays busy while the host leaves', async () => {
		startIDCFresh.mockResolvedValue( 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		const { result } = renderHook( () =>
			useIdentityCrisisActions( {
				redirectUri: 'admin.php?page=jetpack',
				from: 'connection_safe_mode_notice',
			} )
		);

		await act( async () => {
			await expect( result.current.startFresh() ).resolves.toBe(
				'https://jetpack.wordpress.com/jetpack.authorize/1/'
			);
		} );

		expect( startIDCFresh ).toHaveBeenCalledWith(
			'admin.php?page=jetpack',
			'connection_safe_mode_notice'
		);
		expect( result.current.busyAction ).toBe( 'start-fresh' );
	} );

	it( 'stays busy after Stay in Safe Mode succeeds, while the host reloads', async () => {
		confirmIDCSafeMode.mockResolvedValue( {} );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		await act( async () => {
			await expect( result.current.confirmSafeMode() ).resolves.toBe( true );
		} );

		expect( result.current.busyAction ).toBe( 'confirm-safe-mode' );
	} );

	it.each( [ false, 'javascript:alert(1)', 'https://', 'https://example.com:invalid/' ] )(
		'treats a Start fresh response of %j as a server failure',
		async response => {
			startIDCFresh.mockResolvedValue( response );
			const { result } = renderHook( () => useIdentityCrisisActions() );

			await act( async () => {
				await expect( result.current.startFresh() ).resolves.toBeNull();
			} );

			expect( result.current.error ).toEqual( {
				action: 'start-fresh',
				cause: 'server',
				code: 'InvalidConnectUrl',
			} );
			expect( result.current.busyAction ).toBeNull();
		}
	);

	it( 'clears the previous error when an action is retried', async () => {
		confirmIDCSafeMode
			.mockRejectedValueOnce( new clientErrors.FetchNetworkError() )
			.mockResolvedValueOnce( {} );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		await act( () => result.current.confirmSafeMode() );
		expect( result.current.error ).not.toBeNull();

		await act( () => result.current.confirmSafeMode() );
		expect( result.current.error ).toBeNull();
	} );

	it( 'clears the error on request, without retrying', async () => {
		migrateIDC.mockRejectedValue( new clientErrors.FetchNetworkError() );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		await act( () => result.current.migrate() );
		expect( result.current.error ).not.toBeNull();

		act( () => result.current.clearError() );
		expect( result.current.error ).toBeNull();
		expect( migrateIDC ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'getIdentityCrisisErrorCause and getIdentityCrisisErrorCode', () => {
	it.each( [
		[ new clientErrors.FetchNetworkError(), 'offline', 'FetchNetworkError' ],
		[ new clientErrors.JsonParseError(), 'output', 'JsonParseError' ],
		[ new clientErrors.JsonParseAfterRedirectError(), 'output', 'JsonParseAfterRedirectError' ],
		[ new clientErrors.Api404Error(), 'blocked', 'Api404Error' ],
		[ apiError( 'rest_disabled', 403 ), 'blocked', 'rest_disabled' ],
		[ apiError( 'rest_cookie_invalid_nonce', 403 ), 'session', 'rest_cookie_invalid_nonce' ],
		[
			apiError( 'invalid_user_permission_identity_crisis', 403 ),
			'permission',
			'invalid_user_permission_identity_crisis',
		],
		[
			apiError( 'invalid_user_permission_identity_crisis', 401 ),
			'session',
			'invalid_user_permission_identity_crisis',
		],
		[ apiError( 'some_plugin_error', 403 ), 'permission', 'some_plugin_error' ],
		[ apiError( 'error', 500 ), 'server', 'error' ],
		[ new Error( 'boom' ), 'server', undefined ],
		[ undefined, 'server', undefined ],
	] )( '%s is %s with code %s', ( error, cause, code ) => {
		expect( getIdentityCrisisErrorCause( error ) ).toBe( cause );
		expect( getIdentityCrisisErrorCode( error ) ).toBe( code );
	} );
} );
