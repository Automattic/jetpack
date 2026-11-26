import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { createReduxStore, register, select } from '@wordpress/data';
import actions from '../../../state/actions';
import reducers from '../../../state/reducers';
import selectors from '../../../state/selectors';
import STORE_ID from '../../../state/store-id';

const migrateIDC = jest.fn< () => Promise< unknown > >();
const startIDCFresh = jest.fn< ( redirectUri?: string, from?: string ) => Promise< unknown > >();
const confirmIDCSafeMode = jest.fn< () => Promise< unknown > >();
const errorClass = ( name: string ) =>
	class extends Error {
		name = name;
	};
const clientErrors = {
	FetchNetworkError: errorClass( 'FetchNetworkError' ),
};
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { migrateIDC, startIDCFresh, confirmIDCSafeMode },
} ) );

const useIdentityCrisisActions = ( await import( '../index' ) ).default;
const { getIdentityCrisisErrorCause, getIdentityCrisisErrorCode } =
	await import( '../get-error-cause' );

/**
 * An error shaped like the client's `ApiError`, which carries the REST error body.
 *
 * @param code   - The REST error code.
 * @param status - The HTTP status, if any.
 * @param data   - More of the error's `data`.
 * @return The error.
 */
function apiError( code: string, status?: number, data: Record< string, unknown > = {} ): Error {
	return Object.assign( new Error( code ), {
		name: 'ApiError',
		response: { code, data: status === undefined ? data : { status, ...data } },
	} );
}

describe( 'useIdentityCrisisActions', () => {
	beforeEach( () => {
		migrateIDC.mockReset();
		startIDCFresh.mockReset();
		confirmIDCSafeMode.mockReset();
	} );

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

	it.each( [
		[ 'migrate', 'migrate', false ],
		[ 'confirmSafeMode', 'confirm-safe-mode', false ],
		[ 'startFresh', 'start-fresh', null ],
	] as const )( 'records which action failed and why: %s', async ( method, action, failed ) => {
		const rejection = apiError( 'rest_cookie_invalid_nonce', 403 );
		migrateIDC.mockRejectedValue( rejection );
		confirmIDCSafeMode.mockRejectedValue( rejection );
		startIDCFresh.mockRejectedValue( rejection );
		const { result } = renderHook( () => useIdentityCrisisActions() );

		await act( async () => {
			// The path for CONNECT-620's events is accepted on every action.
			await expect(
				result.current[ method ]( { entry: 'main', path: 'original>safe' } )
			).resolves.toBe( failed );
		} );

		expect( result.current.error ).toEqual( {
			action,
			cause: 'session',
			code: 'rest_cookie_invalid_nonce',
		} );
		expect( result.current.busyAction ).toBeNull();
		expect( result.current.isMigrated ).toBe( false );
	} );

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

	it.each( [
		[ 'isDisconnected', apiError( 'cannot_save_secrets', 500, { disconnected: true } ) ],
		[ 'isResolved', apiError( 'start_fresh_not_in_safe_mode', 409 ) ],
	] as const )(
		'keeps %s, and marks the connection store, after a later different failure',
		async ( flag, firstError ) => {
			// Registered once: the rows check different keys.
			if ( ! select( STORE_ID ) ) {
				register(
					createReduxStore( STORE_ID, {
						reducer: reducers,
						actions,
						selectors,
						initialState: { identityCrisis: { useNewScreen: true, canResolve: false } },
					} )
				);
			}
			startIDCFresh
				.mockRejectedValueOnce( firstError )
				.mockRejectedValueOnce( new clientErrors.FetchNetworkError() );
			const { result } = renderHook( () => useIdentityCrisisActions() );

			await act( () => result.current.startFresh() );
			await act( () => result.current.startFresh() );

			expect( result.current.error?.cause ).toBe( 'offline' );
			expect( result.current[ flag ] ).toBe( true );
			expect( select( STORE_ID ).getIdentityCrisis() ).toMatchObject( { [ flag ]: true } );
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
		// One shared row: the rest is covered by `getSiteRequestFailureCause()`'s own test.
		[ new clientErrors.FetchNetworkError(), 'offline', 'FetchNetworkError' ],
		[
			apiError( 'invalid_user_permission_identity_crisis', 401 ),
			'session',
			'invalid_user_permission_identity_crisis',
		],
		[
			apiError( 'invalid_user_permission_identity_crisis' ),
			'permission',
			'invalid_user_permission_identity_crisis',
		],
		[ apiError( 'error', 500 ), 'server', 'error' ],
		[ apiError( 'start_fresh_not_in_safe_mode', 409 ), 'resolved', 'start_fresh_not_in_safe_mode' ],
		[
			apiError( 'site_inaccessible', 500, { disconnected: true } ),
			'disconnected',
			'site_inaccessible',
		],
		[ new Error( 'boom' ), 'server', undefined ],
		[ undefined, 'server', undefined ],
	] )( '%s is %s with code %s', ( error, cause, code ) => {
		expect( getIdentityCrisisErrorCause( error ) ).toBe( cause );
		expect( getIdentityCrisisErrorCode( error ) ).toBe( code );
	} );
} );
