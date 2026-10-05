import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const reconnect = jest.fn< () => Promise< unknown > >();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { reconnect, setApiRoot: jest.fn(), setApiNonce: jest.fn() },
} ) );

jest.unstable_mockModule( '@wordpress/data', () => ( {
	__esModule: true,
	useDispatch: () => ( { disconnectUserSuccess: jest.fn(), setConnectionErrors: jest.fn() } ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

jest.unstable_mockModule( '../../../helpers/get-user-connection-url', () => ( {
	__esModule: true,
	getUserConnectionUrl: () => '#authorize',
} ) );

jest.unstable_mockModule( '../../../state/store', () => ( {
	__esModule: true,
	STORE_ID: 'jetpack-connection',
} ) );

const useRestoreConnection = ( await import( '../index' ) ).default;

describe( 'restoreConnection', () => {
	it( 'reports the message of a failed request without the error name', async () => {
		const error = new Error( 'Ask an administrator (Status 403)' );
		error.name = 'ApiError';
		reconnect.mockRejectedValue( error );
		const { result } = renderHook( () => useRestoreConnection() );

		await act( () => result.current.restoreConnection().catch( () => {} ) );

		expect( result.current.restoreConnectionError ).toBe( 'Ask an administrator (Status 403)' );
		expect( result.current.isRestoringConnection ).toBe( false );
	} );
} );
