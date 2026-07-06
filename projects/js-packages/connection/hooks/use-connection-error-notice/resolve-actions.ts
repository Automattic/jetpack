import { __ } from '@wordpress/i18n';
import type {
	Action,
	ConnectionErrorData,
	ConnectionErrorObject,
	ConnectionErrorProps,
	RestoreConnection,
} from './types';

/**
 * Default tracking event fired when the fallback "Restore Connection" CTA is clicked.
 * Consumers (e.g. My Jetpack) can override this with their own namespaced event.
 */
export const DEFAULT_RECONNECT_TRACKING_EVENT =
	'jetpack_connection_error_notice_reconnect_cta_click';

/**
 * The resolver's options: the public `ConnectionErrorProps` plus the two fields
 * the hook supplies internally (`restoreConnection` / `isRestoringConnection`).
 */
export interface ResolveActionsOptions extends ConnectionErrorProps {
	/** Initiates a connection restore (the default fallback action). */
	restoreConnection: RestoreConnection;
	/** Whether a connection restore is currently in progress. */
	isRestoringConnection: boolean;
}

/**
 * Resolve a connection error object into a list of actionable buttons.
 *
 * This is the single source of truth for turning an error's `error_data`
 * (named handler, URL + label, or fallback) into `{ label, onClick, … }`
 * actions. Both the package's `<ConnectionError />` component and external
 * consumers (My Jetpack) call this so the copy/CTA logic lives in one place.
 *
 * @param {ConnectionErrorObject} connectionError - The effective connection error.
 * @param {ResolveActionsOptions} options         - Resolution options/helpers.
 * @return {Action[]} The resolved actions (may be empty).
 */
export function resolveConnectionErrorActions(
	connectionError: ConnectionErrorObject,
	{
		actionHandlers = {},
		trackingCallback = null,
		customActions = null,
		restoreConnection,
		isRestoringConnection,
		reconnectTrackingEvent = DEFAULT_RECONNECT_TRACKING_EVENT,
		navigate = ( url: string ) => {
			window.location.href = url;
		},
	}: ResolveActionsOptions
): Action[] {
	if ( customActions ) {
		try {
			return customActions( connectionError, {
				restoreConnection,
				isRestoringConnection,
			} );
		} catch {
			// Silently fall back to no actions if customActions throws.
			return [];
		}
	}

	const track = ( event?: string ) => {
		if ( trackingCallback && event ) {
			trackingCallback( event, {} );
		}
	};

	const errorData: ConnectionErrorData = connectionError.error_data ?? {};
	const suggestedAction = errorData.action;
	const actionHandler = suggestedAction ? actionHandlers[ suggestedAction ] : undefined;

	let actions: Action[];

	if ( suggestedAction && actionHandler ) {
		// Named handler from the error data.
		actions = [
			{
				label: errorData.action_label || __( 'Take Action', 'jetpack-connection-js' ),
				onClick: () => {
					try {
						track( errorData.tracking_event );
						actionHandler( connectionError );
					} catch {
						// Silently fail if the action handler throws.
					}
				},
				variant: errorData.action_variant || 'primary',
			},
		];
	} else if ( errorData.action_url && errorData.action_label ) {
		// Generic link action - requires both URL and label for clarity.
		const actionUrl = errorData.action_url;
		actions = [
			{
				label: errorData.action_label,
				onClick: () => {
					try {
						track( errorData.tracking_event );
						navigate( actionUrl );
					} catch {
						// Silently fail if navigation throws.
					}
				},
				variant: errorData.action_variant || 'primary',
			},
		];
	} else {
		// Default action - restore connection.
		actions = [
			{
				label: __( 'Restore Connection', 'jetpack-connection-js' ),
				onClick: () => {
					try {
						track( reconnectTrackingEvent );
						// restoreConnection() rejects asynchronously; its failure is surfaced to
						// the user via restoreConnectionError → getReconnectErrorMessage, so we
						// acknowledge the rejection here to avoid an unhandled promise rejection.
						restoreConnection().catch( () => {} );
					} catch {
						// Silently fail if restore connection throws synchronously.
					}
				},
				isLoading: isRestoringConnection,
				loadingText: __( 'Reconnecting Jetpack…', 'jetpack-connection-js' ),
			},
		];
	}

	// Add secondary action if available (only for custom errors, not the default restore).
	if ( actions.length > 0 && ( suggestedAction || errorData.action_url ) ) {
		const secondaryAction = errorData.secondary_action;
		const secondaryActionHandler = secondaryAction ? actionHandlers[ secondaryAction ] : undefined;
		const secondaryActionUrl = errorData.secondary_action_url;
		const secondaryActionLabel = errorData.secondary_action_label;
		const secondaryActionVariant = errorData.secondary_action_variant || 'secondary';

		// Secondary action with handler.
		if ( secondaryAction && secondaryActionHandler && secondaryActionLabel ) {
			actions.push( {
				label: secondaryActionLabel,
				onClick: () => {
					try {
						track( errorData.secondary_tracking_event );
						secondaryActionHandler( connectionError );
					} catch {
						// Silently fail if the secondary action handler throws.
					}
				},
				variant: secondaryActionVariant,
			} );
		}
		// Secondary action with URL (requires both URL and label).
		else if ( secondaryActionUrl && secondaryActionLabel ) {
			actions.push( {
				label: secondaryActionLabel,
				onClick: () => {
					try {
						track( errorData.secondary_tracking_event );
						navigate( secondaryActionUrl );
					} catch {
						// Silently fail if the secondary action navigation throws.
					}
				},
				variant: secondaryActionVariant,
			} );
		}
	}

	return actions;
}
