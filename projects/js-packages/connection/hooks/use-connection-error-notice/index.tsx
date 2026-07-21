import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection';
import { resolveConnectionErrorActions } from './resolve-actions';
import type {
	ConnectionErrorMap,
	ConnectionErrorObject,
	ConnectionErrorProps,
	UseConnectionErrorNoticeResult,
} from './types';
import type { ReactElement } from 'react';

export type { ConnectionErrorData, ConnectionErrorMap, ConnectionErrorObject } from './types';

/**
 * Connection error notice hook.
 *
 * The single source of truth for user-facing connection errors. It surfaces
 * real WPCOM-reported errors from the store (`connectionErrors`) and resolves
 * them into ready-to-render `actions`, so consumers render resolved CTAs
 * instead of re-deriving copy/handlers themselves. Pass the same options
 * accepted by `<ConnectionError />` to customize action handlers, tracking and
 * navigation.
 *
 * @param {ConnectionErrorProps} options - Action resolution options.
 * @return {UseConnectionErrorNoticeResult} - The hook data, including resolved `actions`.
 */
export default function useConnectionErrorNotice( {
	actionHandlers = {},
	trackingCallback = null,
	customActions = null,
	reconnectTrackingEvent,
	navigate,
	includeHealthErrors = false,
}: ConnectionErrorProps = {} ): UseConnectionErrorNoticeResult {
	const { connectionErrors, connectionHealthErrors } = useConnection( {} );
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	// connectionErrors is typed as Array<string|object> but is actually a nested
	// object at runtime; the store selector can also fall back to `[]`. Normalize
	// to a map so the returned value is honest to the ConnectionErrorMap contract.
	const storedErrorMap: ConnectionErrorMap =
		connectionErrors && typeof connectionErrors === 'object' && ! Array.isArray( connectionErrors )
			? ( connectionErrors as unknown as ConnectionErrorMap )
			: {};
	// `connectionHealthErrors` is typed as a `ConnectionErrorMap` at the store
	// boundary (selector defaults to `{}`, never an array), so no normalization
	// is needed — just guard against a caller that never populated the slot.
	// Only consumers that opted in (i.e. actually ran the probe) inherit it; for
	// everyone else the shared health slot is invisible.
	const healthErrorMap: ConnectionErrorMap = includeHealthErrors
		? connectionHealthErrors ?? {}
		: {};

	// Precedence: real WPCOM-reported store errors win; health-check failures are
	// the fallback so a broken connection still surfaces when the store is empty.
	const errorMap: ConnectionErrorMap = Object.keys( storedErrorMap ).length
		? storedErrorMap
		: healthErrorMap;
	const connectionErrorList = Object.values( errorMap ).shift();
	const firstError: ConnectionErrorObject | undefined =
		connectionErrorList && Object.values( connectionErrorList ).length
			? Object.values( connectionErrorList ).shift()
			: undefined;

	const connectionErrorMessage = firstError?.error_message;
	const hasConnectionError = Boolean( connectionErrorMessage );

	const actions = firstError
		? resolveConnectionErrorActions( firstError, {
				actionHandlers,
				trackingCallback,
				customActions,
				restoreConnection,
				isRestoringConnection,
				reconnectTrackingEvent,
				navigate,
		  } )
		: [];

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: firstError, // Full error object with error_type, etc.
		connectionErrors: errorMap, // All errors for advanced use cases.
		actions, // Resolved CTA actions for the connection error.
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	};
}

export const ConnectionError = ( {
	context,
	...props
}: ConnectionErrorProps = {} ): ReactElement | null => {
	const {
		hasConnectionError,
		connectionErrorMessage,
		actions,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( props );

	if ( ! hasConnectionError ) {
		return null;
	}

	return (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={ actions.length === 0 ? restoreConnection : null }
			message={ connectionErrorMessage }
			context={ context }
			actions={ actions }
		/>
	);
};
