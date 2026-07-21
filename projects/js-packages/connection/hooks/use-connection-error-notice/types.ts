import type { ReactElement } from 'react';

export interface ConnectionErrorData {
	action?: string;
	action_label?: string;
	action_variant?: 'primary' | 'secondary';
	action_url?: string;
	tracking_event?: string;
	secondary_action?: string;
	secondary_action_url?: string;
	secondary_action_label?: string;
	secondary_action_variant?: 'primary' | 'secondary';
	secondary_tracking_event?: string;
	[ key: string ]: unknown;
}

export interface ConnectionErrorObject {
	error_message: string;
	error_code?: string;
	user_id?: string;
	error_type?: string;
	error_data?: ConnectionErrorData;
	[ key: string ]: unknown;
}

/**
 * The shape of connectionErrors from the store: a nested object keyed by error code, then user ID.
 */
export type ConnectionErrorMap = Record< string, Record< string, ConnectionErrorObject > >;

export interface Action {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

/**
 * Initiates a connection restore (or reconnect when restore is not possible).
 * Returns the underlying API request promise.
 */
export type RestoreConnection = ( autoReconnectUser?: boolean ) => Promise< unknown >;

export interface ConnectionErrorProps {
	actionHandlers?: Record< string, ( error: ConnectionErrorObject ) => void >;
	trackingCallback?: ( ( event: string, data: object ) => void ) | null;
	customActions?:
		| ( (
				error: ConnectionErrorObject,
				helpers: {
					restoreConnection: RestoreConnection;
					isRestoringConnection: boolean;
				}
		  ) => Action[] )
		| null;
	/** Tracking event fired when the fallback "Restore Connection" CTA is clicked. */
	reconnectTrackingEvent?: string;
	/** Navigation handler for URL-based actions. Defaults to setting `window.location.href`. */
	navigate?: ( url: string ) => void;
	/** Optional feature-supplied context line rendered above the shared cause/action. */
	context?: string | ReactElement;
	/** Opt in to surfacing connection *health-check* failures. */
	includeHealthErrors?: boolean;
}

/**
 * The return shape of `useConnectionErrorNotice` — the package's stable,
 * public data contract for connection-error consumers.
 */
export interface UseConnectionErrorNoticeResult {
	/** Whether there is an effective connection error to surface. */
	hasConnectionError: boolean;
	/** The effective error's message, if any. */
	connectionErrorMessage: string | undefined;
	/** The full effective error object (with `error_type`, `error_data`, etc.). */
	connectionError: ConnectionErrorObject | undefined;
	/** All errors from the store, for advanced use cases. */
	connectionErrors: ConnectionErrorMap;
	/** Resolved, ready-to-render CTA actions for the effective error. */
	actions: Action[];
	/** Initiates a connection restore (or reconnect when restore is not possible). */
	restoreConnection: RestoreConnection;
	/** Whether a connection restore is currently in progress. */
	isRestoringConnection: boolean;
	/** The restore error message, if the last restore attempt failed. */
	restoreConnectionError: string | null;
}
