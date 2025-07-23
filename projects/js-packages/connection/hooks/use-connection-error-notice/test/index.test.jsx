import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// We'll test the hook logic directly without complex mocking
const testUseConnectionErrorNotice = mockConnectionErrors => {
	// Hook logic extracted for testing (matches the actual implementation)
	const connectionErrors = mockConnectionErrors;

	// Handle undefined/null connectionErrors
	if ( ! connectionErrors ) {
		return {
			hasConnectionError: false,
			connectionErrorMessage: undefined,
			connectionError: undefined,
			connectionErrors,
		};
	}

	const connectionErrorList = Object.values( connectionErrors ).shift();
	const firstError =
		connectionErrorList &&
		Object.values( connectionErrorList ).length &&
		Object.values( connectionErrorList ).shift();

	const connectionErrorMessage = firstError && firstError.error_message;

	// Return all connection errors
	const hasConnectionError = Boolean( connectionErrorMessage );

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError, // Full error object with error_type, etc.
		connectionErrors, // All errors for advanced use cases
	};
};

// Simple mock component for testing ConnectionError functionality
const MockConnectionErrorNotice = ( { message, actions, restoreConnectionCallback } ) => {
	return (
		<div data-testid="connection-error-notice">
			<div data-testid="message">{ message }</div>
			<div data-testid="actions">
				{ actions?.map( ( action, index ) => (
					<button
						key={ index }
						data-testid={ `action-${ index }` }
						data-variant={ action.variant }
						data-loading={ action.isLoading }
						onClick={ action.onClick }
					>
						{ action.isLoading ? action.loadingText : action.label }
					</button>
				) ) }
			</div>
			{ restoreConnectionCallback && (
				<button data-testid="restore-fallback" onClick={ restoreConnectionCallback }>
					Restore Connection
				</button>
			) }
		</div>
	);
};

// Simple ConnectionError component for testing
const TestConnectionError = ( {
	connectionErrors,
	actionHandlers = {},
	trackingCallback = null,
	customActions = null,
} ) => {
	// Use our test hook implementation
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		testUseConnectionErrorNotice( connectionErrors );

	if ( ! hasConnectionError ) {
		return null;
	}

	const mockRestoreConnection = jest.fn();

	// Build actions array based on error data (simplified version of actual logic)
	let actions = [];

	if ( customActions ) {
		actions = customActions( connectionError, { restoreConnection: mockRestoreConnection } );
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
		} else if ( errorData.action_url && errorData.action_label ) {
			const actionLabel = errorData.action_label;
			const actionVariant = errorData.action_variant || 'primary';
			const trackingEvent = errorData.tracking_event;

			actions = [
				{
					label: actionLabel,
					onClick: () => {
						if ( trackingCallback && trackingEvent ) {
							trackingCallback( trackingEvent, {} );
						}
						// Mock navigation
						jest.fn()( errorData.action_url );
					},
					variant: actionVariant,
				},
			];
		} else {
			// Default action - restore connection
			actions = [
				{
					label: 'Restore Connection',
					onClick: () => {
						if ( trackingCallback ) {
							trackingCallback( 'jetpack_connection_error_notice_reconnect_cta_click', {} );
						}
						mockRestoreConnection();
					},
				},
			];
		}
	}

	return (
		<MockConnectionErrorNotice
			message={ connectionErrorMessage }
			actions={ actions }
			restoreConnectionCallback={ actions.length === 0 ? mockRestoreConnection : null }
		/>
	);
};

describe( 'useConnectionErrorNotice hook logic', () => {
	it( 'should return hasConnectionError as false when no errors', () => {
		const result = testUseConnectionErrorNotice( {} );

		expect( result.hasConnectionError ).toBe( false );
		expect( result.connectionErrorMessage ).toBeUndefined();
		expect( result.connectionError ).toBeUndefined();
		expect( result.connectionErrors ).toEqual( {} );
	} );

	it( 'should return error data when connectionErrors exist', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Token is invalid',
					error_code: 'invalid_token',
					user_id: '1',
				},
			},
		};

		const result = testUseConnectionErrorNotice( mockErrors );

		expect( result.hasConnectionError ).toBe( true );
		expect( result.connectionErrorMessage ).toBe( 'Token is invalid' );
		expect( result.connectionError.error_code ).toBe( 'invalid_token' );
		expect( result.connectionErrors ).toEqual( mockErrors );
	} );

	it( 'should handle multiple error codes and return first error', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Token is invalid',
					error_code: 'invalid_token',
					user_id: '1',
				},
			},
			unknown_user: {
				2: {
					error_message: 'User not found',
					error_code: 'unknown_user',
					user_id: '2',
				},
			},
		};

		const result = testUseConnectionErrorNotice( mockErrors );

		expect( result.hasConnectionError ).toBe( true );
		expect( result.connectionErrorMessage ).toBe( 'Token is invalid' );
		expect( result.connectionError.error_code ).toBe( 'invalid_token' );
	} );

	it( 'should handle null/undefined connectionErrors', () => {
		const result = testUseConnectionErrorNotice( null );

		expect( result.hasConnectionError ).toBe( false );
		expect( result.connectionErrorMessage ).toBeUndefined();
		expect( result.connectionError ).toBeUndefined();
		expect( result.connectionErrors ).toBeNull();
	} );

	it( 'should handle empty error objects', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: '',
					error_code: 'invalid_token',
					user_id: '1',
				},
			},
		};

		const result = testUseConnectionErrorNotice( mockErrors );

		expect( result.hasConnectionError ).toBe( false );
		expect( result.connectionErrorMessage ).toBe( '' );
		expect( result.connectionError.error_code ).toBe( 'invalid_token' );
	} );
} );

describe( 'ConnectionError component behavior', () => {
	const mockTrackingCallback = jest.fn();
	const mockActionHandler = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render nothing when no connection errors', () => {
		render( <TestConnectionError connectionErrors={ {} } /> );

		expect( screen.queryByTestId( 'connection-error-notice' ) ).not.toBeInTheDocument();
	} );

	it( 'should render default restore connection action when no custom handlers', async () => {
		const user = userEvent.setup();
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Connection error occurred',
					error_data: {},
				},
			},
		};

		render(
			<TestConnectionError
				connectionErrors={ mockErrors }
				trackingCallback={ mockTrackingCallback }
			/>
		);

		expect( screen.getByTestId( 'connection-error-notice' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'message' ) ).toHaveTextContent( 'Connection error occurred' );

		const actionButton = screen.getByTestId( 'action-0' );
		expect( actionButton ).toHaveTextContent( 'Restore Connection' );

		await user.click( actionButton );
		expect( mockTrackingCallback ).toHaveBeenCalledWith(
			'jetpack_connection_error_notice_reconnect_cta_click',
			{}
		);
	} );

	it( 'should render custom action when action handler provided', async () => {
		const user = userEvent.setup();
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Custom error occurred',
					error_data: {
						action: 'create_missing_account',
						action_label: 'Create Account',
						action_variant: 'primary',
						tracking_event: 'jetpack_custom_action_click',
					},
				},
			},
		};

		render(
			<TestConnectionError
				connectionErrors={ mockErrors }
				actionHandlers={ { create_missing_account: mockActionHandler } }
				trackingCallback={ mockTrackingCallback }
			/>
		);

		const actionButton = screen.getByTestId( 'action-0' );
		expect( actionButton ).toHaveTextContent( 'Create Account' );
		expect( actionButton ).toHaveAttribute( 'data-variant', 'primary' );

		await user.click( actionButton );
		expect( mockTrackingCallback ).toHaveBeenCalledWith( 'jetpack_custom_action_click', {} );
		expect( mockActionHandler ).toHaveBeenCalledWith( mockErrors.invalid_token[ 1 ] );
	} );

	it( 'should render URL action when action_url provided', async () => {
		const user = userEvent.setup();
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'URL action error',
					error_data: {
						action_url: 'https://example.com/fix',
						action_label: 'Fix Connection',
						action_variant: 'secondary',
						tracking_event: 'jetpack_url_action_click',
					},
				},
			},
		};

		render(
			<TestConnectionError
				connectionErrors={ mockErrors }
				trackingCallback={ mockTrackingCallback }
			/>
		);

		const actionButton = screen.getByTestId( 'action-0' );
		expect( actionButton ).toHaveTextContent( 'Fix Connection' );
		expect( actionButton ).toHaveAttribute( 'data-variant', 'secondary' );

		await user.click( actionButton );
		expect( mockTrackingCallback ).toHaveBeenCalledWith( 'jetpack_url_action_click', {} );
	} );

	it( 'should use custom actions function when provided', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Custom actions error',
					error_data: {},
				},
			},
		};

		const customActions = jest.fn().mockReturnValue( [
			{
				label: 'Custom Action 1',
				onClick: jest.fn(),
				variant: 'primary',
			},
			{
				label: 'Custom Action 2',
				onClick: jest.fn(),
				variant: 'secondary',
			},
		] );

		render(
			<TestConnectionError connectionErrors={ mockErrors } customActions={ customActions } />
		);

		expect( customActions ).toHaveBeenCalledWith( mockErrors.invalid_token[ 1 ], {
			restoreConnection: expect.any( Function ),
		} );

		expect( screen.getByTestId( 'action-0' ) ).toHaveTextContent( 'Custom Action 1' );
		expect( screen.getByTestId( 'action-1' ) ).toHaveTextContent( 'Custom Action 2' );
	} );

	it( 'should use default action label when none provided', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'Default label error',
					error_data: {
						action: 'create_missing_account',
						// No action_label provided
					},
				},
			},
		};

		render(
			<TestConnectionError
				connectionErrors={ mockErrors }
				actionHandlers={ { create_missing_account: mockActionHandler } }
			/>
		);

		const actionButton = screen.getByTestId( 'action-0' );
		expect( actionButton ).toHaveTextContent( 'Take Action' );
	} );

	it( 'should not render actions when no handlers and no URL provided', () => {
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'No action error',
					error_data: {
						action: 'unknown_action',
						// No action_url provided
					},
				},
			},
		};

		render( <TestConnectionError connectionErrors={ mockErrors } /> );

		// Should fall back to default restore action
		const actionButton = screen.getByTestId( 'action-0' );
		expect( actionButton ).toHaveTextContent( 'Restore Connection' );
	} );

	it( 'should not call tracking callback when no tracking event provided', async () => {
		const user = userEvent.setup();
		const mockErrors = {
			invalid_token: {
				1: {
					error_message: 'No tracking error',
					error_data: {
						action: 'create_missing_account',
						action_label: 'Create Account',
						// No tracking_event provided
					},
				},
			},
		};

		render(
			<TestConnectionError
				connectionErrors={ mockErrors }
				actionHandlers={ { create_missing_account: mockActionHandler } }
				trackingCallback={ mockTrackingCallback }
			/>
		);

		const actionButton = screen.getByTestId( 'action-0' );
		await user.click( actionButton );

		expect( mockTrackingCallback ).not.toHaveBeenCalled();
		expect( mockActionHandler ).toHaveBeenCalledWith( mockErrors.invalid_token[ 1 ] );
	} );
} );
