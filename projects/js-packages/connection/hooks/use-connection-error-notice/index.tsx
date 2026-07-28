import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection';
import useTakeOverConnection from '../../hooks/use-take-over-connection';
import { resolveConnectionErrorActions } from './resolve-actions';
import type {
	ConnectionErrorMap,
	ConnectionErrorObject,
	ConnectionErrorProps,
	UseConnectionErrorNoticeResult,
} from './types';
import type { ReactElement } from 'react';

export type {
	ConnectionErrorAudience,
	ConnectionErrorData,
	ConnectionErrorMap,
	ConnectionErrorObject,
} from './types';

/**
 * Audience ordering used to pick the single notice to surface: prefer errors the
 * viewer can act on (site-wide, then their own user error, then the owner's). Errors
 * with no audience (e.g. consumer-injected) default to site-wide and keep top priority.
 */
const AUDIENCE_PRIORITY: Record< string, number > = { site: 0, user: 1, owner: 2 };

/**
 * Deterministically select the most relevant error from the map by audience priority.
 *
 * Replaces insertion-order selection, which is nondeterministic when several errors are
 * stored, so the notice a viewer sees no longer depends on option write order.
 *
 * @param {ConnectionErrorMap} errorMap - The nested error map (code => userId => error).
 * @return {ConnectionErrorObject | undefined} The selected error, or undefined when empty.
 */
function selectPrimaryError( errorMap: ConnectionErrorMap ): ConnectionErrorObject | undefined {
	let best: ConnectionErrorObject | undefined;
	let bestRank = Number.POSITIVE_INFINITY;

	for ( const users of Object.values( errorMap ) ) {
		if ( ! users || typeof users !== 'object' ) {
			continue;
		}
		for ( const error of Object.values( users ) ) {
			const audience = error?.audience ?? 'site';
			const rank = AUDIENCE_PRIORITY[ audience ] ?? 0;
			if ( rank < bestRank ) {
				bestRank = rank;
				best = error;
			}
		}
	}

	return best;
}

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
	const { takeOverOwnership } = useTakeOverConnection();

	// Built-in handler for the package's `take_over_ownership` action. Consumer-supplied
	// handlers take precedence, so a consumer can still override the behavior.
	const mergedActionHandlers = {
		take_over_ownership: () => {
			takeOverOwnership().catch( () => {} );
		},
		...actionHandlers,
	};

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
	const firstError: ConnectionErrorObject | undefined = selectPrimaryError( errorMap );

	const connectionErrorMessage = firstError?.error_message;
	const hasConnectionError = Boolean( connectionErrorMessage );

	const actions = firstError
		? resolveConnectionErrorActions( firstError, {
				actionHandlers: mergedActionHandlers,
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
		connectionError,
		actions,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( props );

	if ( ! hasConnectionError ) {
		return null;
	}

	// An explicit 'none' action marks the error as informational only, so the
	// default "Restore Connection" fallback must not be shown either.
	const suppressRestoreFallback = connectionError?.error_data?.action === 'none';

	return (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={
				actions.length === 0 && ! suppressRestoreFallback ? restoreConnection : null
			}
			message={ connectionErrorMessage }
			context={ context }
			actions={ actions }
		/>
	);
};
