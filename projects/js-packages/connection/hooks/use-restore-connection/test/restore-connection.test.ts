import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const reconnect = jest.fn< () => Promise< unknown > >();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { reconnect, setApiRoot: jest.fn(), setApiNonce: jest.fn() },
} ) );

const disconnectUserSuccess = jest.fn();
const setConnectionErrors = jest.fn();
jest.unstable_mockModule( '@wordpress/data', () => ( {
	__esModule: true,
	useDispatch: () => ( { disconnectUserSuccess, setConnectionErrors } ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

const getUserConnectionUrl = jest.fn( () => '#authorize' );
jest.unstable_mockModule( '../../../helpers/get-user-connection-url', () => ( {
	__esModule: true,
	getUserConnectionUrl,
} ) );

jest.unstable_mockModule( '../../../state/store', () => ( {
	__esModule: true,
	STORE_ID: 'jetpack-connection',
} ) );

const useRestoreConnection = ( await import( '../index' ) ).default;

describe( 'restoreConnection', () => {
	beforeEach( () => {
		getUserConnectionUrl.mockClear();
		disconnectUserSuccess.mockClear();
		setConnectionErrors.mockClear();
	} );

	it( 'reports the message of a failed request without the error name', async () => {
		const error = new Error( 'Ask an administrator (Status 403)' );
		error.name = 'ApiError';
		reconnect.mockRejectedValue( error );
		const { result } = renderHook( () => useRestoreConnection() );

		await act( () => result.current.restoreConnection().catch( () => {} ) );

		expect( result.current.restoreConnectionError ).toBe( 'Ask an administrator (Status 403)' );
		expect( result.current.isRestoringConnection ).toBe( false );
	} );

	it( 'builds the caller’s connect link only when it sends the user to reconnect', async () => {
		reconnect.mockResolvedValue( { status: 'in_progress' } );
		const { result } = renderHook( () =>
			useRestoreConnection( { redirectUrl: 'https://example.com/wp-admin/x.php', from: 'here' } )
		);

		expect( getUserConnectionUrl ).not.toHaveBeenCalled();

		await act( () => result.current.restoreConnection() );

		expect( getUserConnectionUrl ).toHaveBeenCalledWith( {
			redirect_url: 'https://example.com/wp-admin/x.php',
			from: 'here',
		} );
	} );

	it.each( [ true, false ] )(
		'updates the store only when not redirecting (autoReconnectUser: %s)',
		async autoReconnectUser => {
			reconnect.mockResolvedValue( { status: 'in_progress' } );
			const { result } = renderHook( () => useRestoreConnection() );

			await act( () => result.current.restoreConnection( autoReconnectUser ) );

			expect( getUserConnectionUrl ).toHaveBeenCalledTimes( autoReconnectUser ? 1 : 0 );
			expect( disconnectUserSuccess ).toHaveBeenCalledTimes( autoReconnectUser ? 0 : 1 );
			expect( setConnectionErrors ).toHaveBeenCalledTimes( autoReconnectUser ? 0 : 1 );
			expect( result.current.isRestoringConnection ).toBe( true );
		}
	);
} );
