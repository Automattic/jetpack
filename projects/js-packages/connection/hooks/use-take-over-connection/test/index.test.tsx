import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

// The connection store reader — mocked to drive connection state.
const useConnection = jest.fn();
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: useConnection,
} ) );

// Script data is read at module load; return an empty connection blob.
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getScriptData: () => ( { connection: {} } ),
} ) );

// The REST transport — mocked so we can assert the owner endpoint call.
const setConnectionOwner = jest.fn();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: {
		setConnectionOwner,
		setApiRoot: jest.fn(),
		setApiNonce: jest.fn(),
	},
} ) );

const { default: useTakeOverConnection } = await import( '../index' );

describe( 'useTakeOverConnection', () => {
	const handleConnectUser = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'posts the current user as the new owner when connected', () => {
		useConnection.mockReturnValue( {
			isUserConnected: true,
			handleConnectUser,
			userConnectionData: { currentUser: { id: 42 } },
		} );
		// A pending promise so the success handler (which reloads the page) never runs;
		// jsdom does not implement navigation. We only need to assert the request.
		setConnectionOwner.mockReturnValue( new Promise( () => {} ) );

		const { result } = renderHook( () => useTakeOverConnection() );

		act( () => {
			void result.current.takeOverOwnership();
		} );

		expect( setConnectionOwner ).toHaveBeenCalledWith( 42 );
		expect( handleConnectUser ).not.toHaveBeenCalled();
	} );

	it( 'routes a disconnected admin through the user-connection flow first', async () => {
		useConnection.mockReturnValue( {
			isUserConnected: false,
			handleConnectUser,
			userConnectionData: { currentUser: { id: 42 } },
		} );

		const { result } = renderHook( () => useTakeOverConnection() );

		await act( async () => {
			await result.current.takeOverOwnership();
		} );

		expect( handleConnectUser ).toHaveBeenCalled();
		expect( setConnectionOwner ).not.toHaveBeenCalled();
	} );
} );
