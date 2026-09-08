import { useCapabilities } from './use-capabilities';
import { useCanQueryWpcom, useConnection } from './use-connection';

/**
 * Whether the dashboard is usable, and if not, why not.
 *
 * `error` carries what the error screen needs, so a consumer doesn't have to read
 * `useCapabilities` a second time for the reason and the retry.
 */
export type GateState =
	| { status: 'not-connected' | 'secondary-admin' | 'loading' | 'no-plan' | 'ready' }
	| {
			status: 'error';
			/** The capabilities read's error, held across a retry. */
			error: Error;
			/** Ask again. */
			onRetry: () => void;
			/** A retry is in flight and there is already something on screen. */
			isRetrying: boolean;
	  };

/**
 * The single decision about whether this site can use the dashboard.
 *
 * Top-to-bottom, first match wins:
 * not-connected → secondary-admin → loading → error → no-plan → ready
 *
 * A hook rather than context: `<BackupNowButton>` renders in `<Page>`'s header actions,
 * above this gate, so it cannot read the verdict through the tree. Both callers hit the
 * same React Query key, so the second costs a cache read and not a request.
 *
 * Only the last step is load-bearing. A pending or failed read leaves `data` undefined
 * too, so the plan check has to follow both or it sells the upsell to a site that may
 * well be entitled. The rest of the chain is mutually exclusive, enforced in the hooks
 * below rather than by this ordering.
 *
 * @return The gate verdict.
 */
export function useGateState(): GateState {
	const connection = useConnection();
	// Hooks can't be called conditionally, so the connection state gates the request
	// rather than the call: without a user connection the bridge can only answer 403.
	const capabilities = useCapabilities( { enabled: useCanQueryWpcom() } );

	if ( ! connection.isFullyConnected ) {
		return { status: 'not-connected' };
	}

	if ( connection.isSecondaryAdminNotConnected ) {
		return { status: 'secondary-admin' };
	}

	if ( capabilities.isLoading ) {
		return { status: 'loading' };
	}

	// Must precede the plan check: a failed request also leaves `data` undefined, and
	// "we couldn't ask" is not "you don't have a plan".
	if ( capabilities.error ) {
		return {
			status: 'error',
			error: capabilities.error,
			onRetry: capabilities.refetch,
			isRetrying: capabilities.isRetrying,
		};
	}

	if ( ! capabilities.data?.hasBackupPlan ) {
		return { status: 'no-plan' };
	}

	return { status: 'ready' };
}
