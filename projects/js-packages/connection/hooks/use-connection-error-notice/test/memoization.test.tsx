import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// The connection store reader — mocked to drive the error inputs.
const useConnection = jest.fn();
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: useConnection,
} ) );

// Restore-connection touches window/REST at import; stub it out. The returned
// members are module-level so the stub behaves like the real hook does now:
// referentially stable across renders.
const restoreConnection = jest.fn();
jest.unstable_mockModule( '../../use-restore-connection', () => ( {
	__esModule: true,
	default: () => ( {
		restoreConnection,
		isRestoringConnection: false,
		restoreConnectionError: null,
	} ),
} ) );

const useConnectionErrorNotice = ( await import( '../index' ) ).default;

const CONNECTION_ERRORS = {
	myplugin: {
		'123': { error_message: 'Connection broke', error_type: 'xmlrpc', user_id: 123 },
	},
};

const OTHER_CONNECTION_ERRORS = {
	myplugin: {
		'123': { error_message: 'Something else broke', error_type: 'xmlrpc', user_id: 123 },
	},
};

const mockConnection = ( connectionErrors: object = CONNECTION_ERRORS ) =>
	useConnection.mockReturnValue( {
		connectionErrors,
		connectionHealthErrors: {},
		connectionOwner: { id: 123, displayName: 'Owner' },
		userConnectionData: { currentUser: { id: 123 } },
		isRegistered: true,
		isUserConnected: true,
	} );

// Consumers key effects and memos off what this hook returns — My Jetpack re-sets
// its notice whenever these change identity — so a render that changes nothing
// must hand back the same objects.
describe( 'useConnectionErrorNotice memoization', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'returns the same derived values when nothing in the store changed', () => {
		mockConnection();

		const { result, rerender } = renderHook( () => useConnectionErrorNotice() );
		const first = result.current;

		rerender();

		expect( result.current.connectionErrors ).toBe( first.connectionErrors );
		expect( result.current.viewer ).toBe( first.viewer );
		expect( result.current.displayableErrors ).toBe( first.displayableErrors );
		expect( result.current.errorGroups ).toBe( first.errorGroups );
		expect( result.current.connectionError ).toBe( first.connectionError );
		expect( result.current.actions ).toBe( first.actions );
	} );

	it( 'rebuilds the derived values when the store errors change', () => {
		mockConnection();

		const { result, rerender } = renderHook( () => useConnectionErrorNotice() );
		const first = result.current;

		mockConnection( OTHER_CONNECTION_ERRORS );
		rerender();

		expect( result.current.errorGroups ).not.toBe( first.errorGroups );
		expect( result.current.connectionErrorMessage ).toBe( 'Something else broke' );
	} );
} );
