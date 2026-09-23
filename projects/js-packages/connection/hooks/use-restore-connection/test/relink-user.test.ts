import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const unlinkUser = jest.fn< () => Promise< unknown > >();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { unlinkUser, reconnect: jest.fn(), setApiRoot: jest.fn(), setApiNonce: jest.fn() },
} ) );

const disconnectUserSuccess = jest.fn();
const setConnectionErrors = jest.fn();
jest.unstable_mockModule( '@wordpress/data', () => ( {
	__esModule: true,
	useDispatch: () => ( { disconnectUserSuccess, setConnectionErrors } ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

// A hash-only target, so jsdom can follow the redirect without a real navigation.
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

describe( 'relinkUser', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.location.hash = '';
	} );

	it( 'unlinks the stored token, then sends the user to authorize and back to this page', async () => {
		unlinkUser.mockResolvedValue( { code: 'success' } );
		const { result } = renderHook( () => useRestoreConnection() );

		await act( () => result.current.relinkUser() );

		expect( unlinkUser ).toHaveBeenCalled();
		expect( disconnectUserSuccess ).toHaveBeenCalled();
		expect( setConnectionErrors ).toHaveBeenCalledWith( {} );
		expect( getUserConnectionUrl ).toHaveBeenCalledWith( {
			redirect_url: expect.stringMatching( /^http/ ),
		} );
		expect( window.location.hash ).toBe( '#authorize' );
	} );

	it( 'goes straight to authorize when no token is stored', async () => {
		const { result } = renderHook( () => useRestoreConnection() );

		await act( () => result.current.relinkUser( false ) );

		expect( unlinkUser ).not.toHaveBeenCalled();
		expect( window.location.hash ).toBe( '#authorize' );
	} );

	it( 'reports a failed unlink and stays on the page', async () => {
		unlinkUser.mockRejectedValue( new Error( 'Unable to unlink the user (Status 500)' ) );
		const { result } = renderHook( () => useRestoreConnection() );

		await act( () => result.current.relinkUser().catch( () => {} ) );

		expect( result.current.restoreConnectionError ).toBe(
			'Unable to unlink the user (Status 500)'
		);
		expect( result.current.isRestoringConnection ).toBe( false );
		expect( window.location.hash ).toBe( '' );
	} );
} );
