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
 * @return {object} - The hook data, including resolved `actions`.
 */
export default function useConnectionErrorNotice( {
	actionHandlers = {},
	trackingCallback = null,
	customActions = null,
	reconnectTrackingEvent,
	navigate,
}: ConnectionErrorProps = {} ): UseConnectionErrorNoticeResult {
	const { connectionErrors } = useConnection( {} );
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	// connectionErrors is typed as Array<string|object> but is actually a nested object at runtime.
	const errorMap = connectionErrors as unknown as ConnectionErrorMap;
	const connectionErrorList = Object.values( errorMap ).shift();
	const firstError: ConnectionErrorObject | undefined =
		connectionErrorList && Object.values( connectionErrorList ).length
			? Object.values( connectionErrorList ).shift()
			: undefined;

	const connectionErrorMessage = firstError?.error_message;
	const hasConnectionError = Boolean( connectionErrorMessage );

	const actions = resolveConnectionErrorActions( firstError, {
		actionHandlers,
		trackingCallback,
		customActions,
		restoreConnection,
		isRestoringConnection,
		reconnectTrackingEvent,
		navigate,
	} );

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

export const ConnectionError = ( props: ConnectionErrorProps = {} ): ReactElement | null => {
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

	// If no actions resolved and no custom handler was provided, don't render.
	if ( actions.length === 0 && ! props.customActions ) {
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
