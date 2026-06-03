import { __ } from '@wordpress/i18n';
import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection';
import type {
	Action,
	ConnectionErrorData,
	ConnectionErrorMap,
	ConnectionErrorObject,
	ConnectionErrorProps,
} from './types';
import type { ReactElement } from 'react';

export type { ConnectionErrorData, ConnectionErrorMap, ConnectionErrorObject } from './types';

/**
 * Connection error notice hook.
 * Returns connection error data and conditional flag on whether
 * to render the component or not.
 *
 * @return {object} - The hook data.
 */
export default function useConnectionErrorNotice() {
	const { connectionErrors } = useConnection( {} );
	// connectionErrors is typed as Array<string|object> but is actually a nested object at runtime.
	const errorMap = connectionErrors as unknown as ConnectionErrorMap;
	const connectionErrorList = Object.values( errorMap ).shift();
	const firstError: ConnectionErrorObject | undefined =
		connectionErrorList && Object.values( connectionErrorList ).length
			? Object.values( connectionErrorList ).shift()
			: undefined;

	const connectionErrorMessage = firstError?.error_message;

	// Return all connection errors
	const hasConnectionError = Boolean( connectionErrorMessage );

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError, // Full error object with error_type, etc.
		connectionErrors: errorMap, // All errors for advanced use cases
	};
}

export const ConnectionError = ( {
	actionHandlers = {},
	trackingCallback = null,
	customActions = null,
}: ConnectionErrorProps = {} ): ReactElement | null => {
	const { hasConnectionError, connectionErrorMessage, connectionError } =
		useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	if ( ! hasConnectionError ) {
		return null;
	}

	// Build actions array based on error data
	let actions: Action[];

	if ( customActions ) {
		// Use provided custom actions function
		try {
			actions = customActions( connectionError as ConnectionErrorObject, {
				restoreConnection,
				isRestoringConnection,
			} );
		} catch {
			// Silently fall back to default behavior if customActions fails
			actions = [];
		}
	} else {
		// Get action info from error data
		const errorData = connectionError?.error_data || ( {} as ConnectionErrorData );
		const suggestedAction = errorData.action;
		const actionHandler = suggestedAction ? actionHandlers[ suggestedAction ] : undefined;

		if ( suggestedAction && actionHandler ) {
			// Use action data from the error
			const actionLabel = errorData.action_label || __( 'Take Action', 'jetpack-connection-js' );
			const actionVariant = errorData.action_variant || 'primary';
			const trackingEvent = errorData.tracking_event;

			actions = [
				{
					label: actionLabel,
					onClick: () => {
						try {
							if ( trackingCallback && trackingEvent ) {
								trackingCallback( trackingEvent, {} );
							}
							actionHandler( connectionError as ConnectionErrorObject );
						} catch {
							// Silently fail if action handler throws
						}
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
						try {
							if ( trackingCallback && trackingEvent ) {
								trackingCallback( trackingEvent, {} );
							}
							window.location.href = errorData.action_url as string;
						} catch {
							// Silently fail if navigation throws
						}
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
						try {
							if ( trackingCallback ) {
								trackingCallback( 'jetpack_connection_error_notice_reconnect_cta_click', {} );
							}
							restoreConnection();
						} catch {
							// Silently fail if restore connection throws
						}
					},
					isLoading: isRestoringConnection,
					loadingText: __( 'Reconnecting Jetpack…', 'jetpack-connection-js' ),
				},
			];
		}

		// Add secondary action if available (only for custom errors, not default restore)
		if ( actions.length > 0 && ( suggestedAction || errorData.action_url ) ) {
			const secondaryAction = errorData.secondary_action;
			const secondaryActionHandler = secondaryAction
				? actionHandlers[ secondaryAction ]
				: undefined;
			const secondaryActionUrl = errorData.secondary_action_url;
			const secondaryActionLabel = errorData.secondary_action_label;

			// Secondary action with handler
			if ( secondaryAction && secondaryActionHandler && secondaryActionLabel ) {
				const secondaryActionVariant = errorData.secondary_action_variant || 'secondary';
				const secondaryTrackingEvent = errorData.secondary_tracking_event;

				actions.push( {
					label: secondaryActionLabel,
					onClick: () => {
						try {
							if ( trackingCallback && secondaryTrackingEvent ) {
								trackingCallback( secondaryTrackingEvent, {} );
							}
							secondaryActionHandler( connectionError as ConnectionErrorObject );
						} catch {
							// Silently fail if secondary action handler throws
						}
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
						try {
							if ( trackingCallback && secondaryTrackingEvent ) {
								trackingCallback( secondaryTrackingEvent, {} );
							}
							window.location.href = secondaryActionUrl;
						} catch {
							// Silently fail if secondary action navigation throws
						}
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
			restoreConnectionCallback={ actions.length === 0 ? restoreConnection : null }
			message={ connectionErrorMessage }
			actions={ actions }
		/>
	);
};
