import { useCapabilities } from './use-capabilities';
import { useCanQueryWpcom, useConnection } from './use-connection';

/**
 * Whether the dashboard is usable, and if not, why not.
 *
 * `error` carries what the error screen needs, so a consumer that wants
 * to render it doesn't have to read `useCapabilities` a second time to
 * find the reason and the way to ask again.
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
 * Two consumers need this answer and they cannot share it through the
 * tree: `<Gates>` wraps the dashboard body, but `DashboardLayout` passes
 * header actions to `<Page>`, which renders them *above* `<Gates>`
 * rather than inside it — so `<BackupNowButton>` has to reach the same
 * verdict on its own or it would offer an unconnected or unlicensed site
 * a control that cannot work. Hence a hook rather than context: both
 * read the same React Query key, so the second caller costs a cache read
 * and not a request.
 *
 * Only one step of that order is load-bearing: the plan check has to
 * come last. A pending or failed read leaves `data` undefined too, which
 * is indistinguishable here from an honest "no plan" — so hoisting it
 * above either one sells the upsell to a site that may well be entitled.
 *
 * The rest of the chain is mutually exclusive rather than prioritised,
 * and what makes each pair safe lives in the hooks below rather than in
 * the order these branches happen to be written in.
 *
 * The two connection branches can never both match, because
 * `isSecondaryAdminNotConnected` is derived as `isFullyConnected &&
 * ! isUserConnected` (`use-connection.ts`). Nor is listing them first
 * what spares a disconnected site a doomed request: `enabled` does that,
 * and a disabled query reports `isLoading` false, so the loading branch
 * could not match there even if it were hoisted above them.
 *
 * Loading and error are likewise exclusive, because `useCapabilities`
 * computes `isLoading` as `query.isLoading && error === null`. That is
 * what stops a retry — which rewinds an errored query back to pending —
 * from re-entering the loading branch and replacing the error screen,
 * reason and explanation and the only control that can ask again, with a
 * bare spinner for the whole round trip.
 *
 * @return The gate verdict.
 */
export function useGateState(): GateState {
	const connection = useConnection();
	// Hooks can't be called conditionally, so the connection state gates
	// the request itself rather than the call: without a user-level WPCOM
	// connection the bridge can only answer 403.
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

	// Must precede the plan check: a failed request also leaves `data`
	// undefined, and "we couldn't ask" must not be reported as "you
	// don't have a plan".
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
