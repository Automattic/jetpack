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

	// Return all connection errors
	const hasConnectionError = Boolean( connectionErrorMessage );

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError, // Full error object with error_type, etc.
		connectionErrors, // All errors for advanced use cases
	};
}

export const ConnectionError = ( {
	actionHandlers = {}, // Handlers for specific actions like { create_missing_account: () => {}, custom_action: () => {} }
	trackingCallback = null, // Custom tracking function
	customActions = null, // Function that returns custom actions based on error (takes precedence)
} = {} ) => {
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	if ( ! hasConnectionError ) {
		return null;
	}

	// Build actions array based on error data
	let actions = [];

	if ( customActions ) {
		// Use provided custom actions function
		actions = customActions( connectionError, { restoreConnection, isRestoringConnection } );
	} else {
		// Get action info from error data
		const errorData = connectionError?.error_data || {};
		const suggestedAction = errorData.action;
		const actionHandler = actionHandlers[ suggestedAction ];

		if ( suggestedAction && actionHandler ) {
			// Use action data from the error
			const actionLabel = errorData.action_label || __( 'Take Action', 'jetpack-connection-js' );
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
			// Generic link action - requires both URL and label for clarity
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
						window.location.href = errorData.action_url;
					},
					variant: actionVariant,
				},
			];
		} else {
			// Default action - restore connection
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

		// Add secondary action if available (only for custom errors, not default restore)
		if ( actions.length > 0 && ( suggestedAction || errorData.action_url ) ) {
			const secondaryAction = errorData.secondary_action;
			const secondaryActionHandler = actionHandlers[ secondaryAction ];
			const secondaryActionUrl = errorData.secondary_action_url;
			const secondaryActionLabel = errorData.secondary_action_label;

			// Secondary action with handler
			if ( secondaryAction && secondaryActionHandler && secondaryActionLabel ) {
				const secondaryActionVariant = errorData.secondary_action_variant || 'secondary';
				const secondaryTrackingEvent = errorData.secondary_tracking_event;

				actions.push( {
					label: secondaryActionLabel,
					onClick: () => {
						if ( trackingCallback && secondaryTrackingEvent ) {
							trackingCallback( secondaryTrackingEvent, {} );
						}
						secondaryActionHandler( connectionError );
					},
					variant: secondaryActionVariant,
				} );
			}
			// Secondary action with URL (requires both URL and label)
			else if ( secondaryActionUrl && secondaryActionLabel ) {
				const secondaryActionVariant = errorData.secondary_action_variant || 'secondary';
				const secondaryTrackingEvent = errorData.secondary_tracking_event;

				actions.push( {
					label: secondaryActionLabel,
					onClick: () => {
						if ( trackingCallback && secondaryTrackingEvent ) {
							trackingCallback( secondaryTrackingEvent, {} );
						}
						window.location.href = secondaryActionUrl;
					},
					variant: secondaryActionVariant,
				} );
			}
		}
	}

	// If no actions are available and no custom handler provided, don't render
	if ( actions.length === 0 && ! customActions ) {
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
