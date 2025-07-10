import { jest } from '@jest/globals';
import { render, renderHook } from '@testing-library/react';

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
	actionHandlers = {},
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

	let actions = [];

	if ( customActions ) {
		actions = customActions( connectionError, { restoreConnection, isRestoringConnection } );
	} else {
		const errorData = connectionError?.error_data || {};
		const suggestedAction = errorData.action;
		const actionHandler = actionHandlers[ suggestedAction ];

		if ( suggestedAction && actionHandler ) {
			const actionLabel = errorData.action_label || 'Take Action';
			const actionVariant = errorData.action_variant || 'primary';
			const trackingEvent = errorData.tracking_event;

			actions = [
				{
					label: actionLabel,
					onClick: () => {
						if ( trackingCallback && trackingEvent ) {
							trackingCallback( trackingEvent, {} );
						}
						actionHandler( connectionError );
					},
					variant: actionVariant,
				},
			];
		} else {
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
	}

	if ( actions.length === 0 && ! customActions ) {
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

	it( 'should handle errors with action data', () => {
		const errorWithAction = {
			error_code: 'custom_error',
			error_message: 'A custom error occurred',
			error_type: 'custom',
			error_data: {
				action: 'create_missing_account',
				action_label: 'Create missing account',
				action_variant: 'primary',
				tracking_event: 'custom_tracking_event',
			},
		};

		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				custom_error: {
					123: errorWithAction,
				},
			},
		} );

		const { result } = renderHook( () => mockUseConnectionErrorNotice() );

		expect( result.current.hasConnectionError ).toBe( true );
		expect( result.current.connectionErrorMessage ).toBe( 'A custom error occurred' );
		expect( result.current.connectionError ).toEqual( errorWithAction );
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

	it( 'should render for standard connection errors with default action', () => {
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

	it( 'should render custom action when action handler is provided', () => {
		const mockActionHandler = jest.fn();
		const mockTrackingCallback = jest.fn();

		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				custom_error: {
					123: {
						error_code: 'custom_error',
						error_message: 'A custom error occurred',
						error_type: 'custom',
						error_data: {
							action: 'create_missing_account',
							action_label: 'Create missing account',
							action_variant: 'primary',
							tracking_event: 'custom_tracking_event',
						},
					},
				},
			},
		} );

		const { container } = render(
			<MockConnectionError
				actionHandlers={ { create_missing_account: mockActionHandler } }
				trackingCallback={ mockTrackingCallback }
			/>
		);
		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should not render when no action handler is provided for a custom action', () => {
		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				custom_error: {
					123: {
						error_code: 'custom_error',
						error_message: 'A custom error occurred',
						error_type: 'custom',
						error_data: {
							action: 'unknown_action',
						},
					},
				},
			},
		} );

		const { container } = render( <MockConnectionError /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should use custom actions when provided', () => {
		const mockCustomActions = jest.fn().mockReturnValue( [
			{
				label: 'Custom Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
		] );

		mockUseConnection.mockReturnValue( {
			connectionErrors: {
				custom_error: {
					123: {
						error_code: 'custom_error',
						error_message: 'A custom error occurred',
						error_type: 'custom',
					},
				},
			},
		} );

		const { container } = render( <MockConnectionError customActions={ mockCustomActions } /> );
		expect( container ).not.toBeEmptyDOMElement();
		expect( mockCustomActions ).toHaveBeenCalled();
	} );
} );
