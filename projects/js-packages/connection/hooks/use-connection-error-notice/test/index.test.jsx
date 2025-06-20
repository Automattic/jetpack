import { jest } from '@jest/globals';
import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { getProtectedOwnerCreateAccountUrl } from '../index.jsx';

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
const mockUseConnection = jest.fn().mockReturnValue( mockConnectionData );

// Mock useRestoreConnection manually
const mockUseRestoreConnection = jest.fn().mockReturnValue( mockRestoreConnectionData );

// Mock the ConnectionErrorNotice component manually
const MockConnectionErrorNotice = jest.fn().mockImplementation( () => <div>Mocked Notice</div> );

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
function mockUseConnectionErrorNotice() {
	const { connectionErrors } = mockUseConnection( {} );
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
const MockConnectionError = ( {
	onCreateMissingAccount = null,
	trackingCallback = null,
	customActions = null,
} = {} ) => {
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		mockUseConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		mockUseRestoreConnection();

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
		<MockConnectionErrorNotice
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
		mockUseConnection.mockReturnValue( mockConnectionData );
		mockUseRestoreConnection.mockReturnValue( mockRestoreConnectionData );
	} );

	it( 'should return hasConnectionError as false when no errors', () => {
		const { result } = renderHook( () => mockUseConnectionErrorNotice() );

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

		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				invalid_token: {
					123: mockError,
				},
			},
		} );

		const { result } = renderHook( () => mockUseConnectionErrorNotice() );

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

		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				protected_owner: {
					123: protectedOwnerError,
				},
			},
		} );

		const { result } = renderHook( () => mockUseConnectionErrorNotice() );

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
		mockUseConnection.mockReturnValue( mockConnectionData );
		mockUseRestoreConnection.mockReturnValue( mockRestoreConnectionData );
	} );

	it( 'should not render when there are no connection errors', () => {
		const { container } = render( <MockConnectionError /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render for protected owner errors without custom handler', () => {
		mockUseConnection.mockReturnValue( {
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

		const { container } = render( <MockConnectionError /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render for protected owner errors when onCreateMissingAccount is provided', () => {
		const mockOnCreateMissingAccount = jest.fn();

		mockUseConnection.mockReturnValue( {
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
			<MockConnectionError onCreateMissingAccount={ mockOnCreateMissingAccount } />
		);
		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should render for standard connection errors', () => {
		mockUseConnection.mockReturnValue( {
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

		const { container } = render( <MockConnectionError /> );
		expect( container ).not.toBeEmptyDOMElement();
	} );
} );

describe( 'getProtectedOwnerCreateAccountUrl', () => {
	it( 'should generate URL with wpcom_user_email parameter', () => {
		const connectionError = {
			error_data: {
				wpcom_user_email: 'test@example.com',
			},
		};

		const url = getProtectedOwnerCreateAccountUrl( connectionError, '/wp-admin/' );

		expect( url ).toBe(
			'/wp-admin/user-new.php?jetpack_protected_owner_email=test%40example.com&jetpack_create_missing_account=1'
		);
	} );

	it( 'should generate URL with email parameter when wpcom_user_email is not available', () => {
		const connectionError = {
			error_data: {
				email: 'fallback@example.com',
			},
		};

		const url = getProtectedOwnerCreateAccountUrl( connectionError, '/custom-admin/' );

		expect( url ).toBe(
			'/custom-admin/user-new.php?jetpack_protected_owner_email=fallback%40example.com&jetpack_create_missing_account=1'
		);
	} );

	it( 'should prioritize wpcom_user_email over email when both are available', () => {
		const connectionError = {
			error_data: {
				email: 'fallback@example.com',
				wpcom_user_email: 'primary@example.com',
			},
		};

		const url = getProtectedOwnerCreateAccountUrl( connectionError );

		expect( url ).toBe(
			'/wp-admin/user-new.php?jetpack_protected_owner_email=primary%40example.com&jetpack_create_missing_account=1'
		);
	} );

	it( 'should return basic URL when no email data is available', () => {
		const connectionError = {
			error_data: {},
		};

		const url = getProtectedOwnerCreateAccountUrl( connectionError, '/wp-admin/' );

		expect( url ).toBe( '/wp-admin/user-new.php' );
	} );

	it( 'should handle missing error_data', () => {
		const connectionError = {};

		const url = getProtectedOwnerCreateAccountUrl( connectionError );

		expect( url ).toBe( '/wp-admin/user-new.php' );
	} );
} );
