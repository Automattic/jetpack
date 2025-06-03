import { __ } from '@wordpress/i18n';
import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection/index.jsx';

/**
 * Connection error notice hook.
 * Returns connection error data and conditional flag on whether
 * to render the component or not.
 *
 * @return {object} - The hook data.
 */
export default function useConnectionErrorNotice() {
	const { connectionErrors } = useConnection( {} );
	const connectionErrorList = Object.values( connectionErrors ).shift();
	const firstError =
		connectionErrorList &&
		Object.values( connectionErrorList ).length &&
		Object.values( connectionErrorList ).shift();

	const connectionErrorMessage = firstError && firstError.error_message;

	// Return all connection errors, including protected owner errors
	const hasConnectionError = Boolean( connectionErrorMessage );

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError, // Full error object with error_type, etc.
		connectionErrors, // All errors for advanced use cases
	};
}

export const ConnectionError = ( {
	onCreateMissingAccount = null, // Custom handler for protected owner errors
	trackingCallback = null, // Custom tracking function
	customActions = null, // Function that returns custom actions based on error
} = {} ) => {
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	if ( ! hasConnectionError ) {
		return null;
	}

	// Determine error type
	const isProtectedOwnerError = connectionError && connectionError.error_type === 'protected_owner';

	// Build actions array based on error type
	let actions = [];

	if ( customActions ) {
		// Use provided custom actions function
		actions = customActions( connectionError, { restoreConnection, isRestoringConnection } );
	} else if ( isProtectedOwnerError && onCreateMissingAccount ) {
		// Handle protected owner error with custom handler
		actions = [
			{
				label: __( 'Create missing account', 'jetpack-connection-js' ),
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
		// Standard connection error - use restore connection
		actions = [
			{
				label: __( 'Restore Connection', 'jetpack-connection-js' ),
				onClick: () => {
					if ( trackingCallback ) {
						trackingCallback( 'jetpack_connection_error_notice_reconnect_cta_click', {} );
					}
					restoreConnection();
				},
				isLoading: isRestoringConnection,
				loadingText: __( 'Reconnecting Jetpack…', 'jetpack-connection-js' ),
			},
		];
	}

	// For protected owner errors without custom handler, don't show the component
	if ( isProtectedOwnerError && ! onCreateMissingAccount && ! customActions ) {
		return null;
	}

	return (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={ actions.length === 0 ? restoreConnection : null } // Fallback for backward compatibility
			message={ connectionErrorMessage }
			actions={ actions }
		/>
	);
};
