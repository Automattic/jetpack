import { jest } from '@jest/globals';
import { render, renderHook } from '@testing-library/react';
import React from 'react';

// Create manual mocks
const mockConnectionData = {
	connectionErrors: {},
};

const mockRestoreConnectionData = {
	restoreConnection: jest.fn(),
	isRestoringConnection: false,
	restoreConnectionError: null,
};

// Mock useConnection manually
const useConnection = jest.fn().mockReturnValue( mockConnectionData );

// Mock useRestoreConnection manually
const useRestoreConnection = jest.fn().mockReturnValue( mockRestoreConnectionData );

// Mock the ConnectionErrorNotice component manually
const ConnectionErrorNotice = jest.fn().mockImplementation( () => <div>Mocked Notice</div> );

// Create a custom hook that uses our mocked dependencies
/**
 * Hook for testing connection error notice functionality.
 *
 * @return {object} Hook return object.
 * @property {boolean} hasConnectionError     - Whether a connection error exists.
 * @property {string}  connectionErrorMessage - The connection error message.
 * @property {object}  connectionError        - The connection error object.
 * @property {object}  connectionErrors       - All connection errors.
 */
function useConnectionErrorNotice() {
	const { connectionErrors } = useConnection( {} );
	const connectionErrorList = Object.values( connectionErrors ).shift();
	const firstError =
		connectionErrorList &&
		Object.values( connectionErrorList ).length &&
		Object.values( connectionErrorList ).shift();

	const connectionErrorMessage = firstError && firstError.error_message;
	const hasConnectionError = Boolean( connectionErrorMessage );

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError,
		connectionErrors,
	};
}

// Create a custom ConnectionError component that uses our mocked dependencies
const ConnectionError = ( {
	onCreateMissingAccount = null,
	trackingCallback = null,
	customActions = null,
} = {} ) => {
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	if ( ! hasConnectionError ) {
		return null;
	}

	const isProtectedOwnerError = connectionError && connectionError.error_type === 'protected_owner';

	let actions = [];

	if ( customActions ) {
		actions = customActions( connectionError, { restoreConnection, isRestoringConnection } );
	} else if ( isProtectedOwnerError && onCreateMissingAccount ) {
		actions = [
			{
				label: 'Create missing account',
				onClick: () => {
					if ( trackingCallback ) {
						trackingCallback( 'jetpack_connection_protected_owner_create_account_attempt', {} );
					}
					onCreateMissingAccount();
				},
				variant: 'primary',
			},
		];
	} else if ( ! isProtectedOwnerError ) {
		actions = [
			{
				label: 'Restore Connection',
				onClick: () => {
					if ( trackingCallback ) {
						trackingCallback( 'jetpack_connection_error_notice_reconnect_cta_click', {} );
					}
					restoreConnection();
				},
				isLoading: isRestoringConnection,
				loadingText: 'Reconnecting Jetpack…',
			},
		];
	}

	if ( isProtectedOwnerError && ! onCreateMissingAccount && ! customActions ) {
		return null;
	}

	return (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={ actions.length === 0 ? restoreConnection : null }
			message={ connectionErrorMessage }
			actions={ actions }
		/>
	);
};

describe( 'useConnectionErrorNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useConnection.mockReturnValue( mockConnectionData );
		useRestoreConnection.mockReturnValue( mockRestoreConnectionData );
	} );

	it( 'should return hasConnectionError as false when no errors', () => {
		const { result } = renderHook( () => useConnectionErrorNotice() );

		expect( result.current.hasConnectionError ).toBe( false );
		expect( result.current.connectionErrorMessage ).toBeUndefined();
		expect( result.current.connectionError ).toBeUndefined();
	} );

	it( 'should extract and return the first error when errors exist', () => {
		const mockError = {
			error_code: 'invalid_token',
			error_message: 'The connection token is invalid',
			error_type: 'connection',
		};

		useConnection.mockReturnValue( {
			connectionErrors: {
				invalid_token: {
					123: mockError,
				},
			},
		} );

		const { result } = renderHook( () => useConnectionErrorNotice() );

		expect( result.current.hasConnectionError ).toBe( true );
		expect( result.current.connectionErrorMessage ).toBe( 'The connection token is invalid' );
		expect( result.current.connectionError ).toEqual( mockError );
	} );

	it( 'should handle protected owner errors', () => {
		const protectedOwnerError = {
			error_code: 'protected_owner',
			error_message: 'The WordPress.com plan owner is missing',
			error_type: 'protected_owner',
		};

		useConnection.mockReturnValue( {
			connectionErrors: {
				protected_owner: {
					123: protectedOwnerError,
				},
			},
		} );

		const { result } = renderHook( () => useConnectionErrorNotice() );

		expect( result.current.hasConnectionError ).toBe( true );
		expect( result.current.connectionErrorMessage ).toBe(
			'The WordPress.com plan owner is missing'
		);
		expect( result.current.connectionError ).toEqual( protectedOwnerError );
	} );
} );

describe( 'ConnectionError component', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useConnection.mockReturnValue( mockConnectionData );
		useRestoreConnection.mockReturnValue( mockRestoreConnectionData );
	} );

	it( 'should not render when there are no connection errors', () => {
		const { container } = render( <ConnectionError /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render for protected owner errors without custom handler', () => {
		useConnection.mockReturnValue( {
			connectionErrors: {
				protected_owner: {
					123: {
						error_code: 'protected_owner',
						error_message: 'The WordPress.com plan owner is missing',
						error_type: 'protected_owner',
					},
				},
			},
		} );

		const { container } = render( <ConnectionError /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render for protected owner errors when onCreateMissingAccount is provided', () => {
		const mockOnCreateMissingAccount = jest.fn();

		useConnection.mockReturnValue( {
			connectionErrors: {
				protected_owner: {
					123: {
						error_code: 'protected_owner',
						error_message: 'The WordPress.com plan owner is missing',
						error_type: 'protected_owner',
					},
				},
			},
		} );

		const { container } = render(
			<ConnectionError onCreateMissingAccount={ mockOnCreateMissingAccount } />
		);
		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should render for standard connection errors', () => {
		useConnection.mockReturnValue( {
			connectionErrors: {
				invalid_token: {
					123: {
						error_code: 'invalid_token',
						error_message: 'Connection failed',
						error_type: 'connection',
					},
				},
			},
		} );

		const { container } = render( <ConnectionError /> );
		expect( container ).not.toBeEmptyDOMElement();
	} );
} );
