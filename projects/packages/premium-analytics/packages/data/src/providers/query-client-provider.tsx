/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { getApiErrorStatus, shouldRetryApiError } from '../utils';
import { globalErrorManager } from './global-error-manager';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

/**
 * QueryCache with global error detection for auth and server errors.
 *
 * Error codes handled:
 * - 401: Authentication failure (session expired, invalid token)
 * - 502: Bad gateway (proxy/load balancer can't reach upstream)
 * - 503: Service unavailable (server overloaded or under maintenance)
 * - 504: Gateway timeout (request took too long)
 *
 * This is QueryClient configuration (not a side effect subscription), so it's
 * appropriate at module level. The globalErrorManager singleton is used here
 * because QueryClient must be instantiated once (singleton pattern), but the
 * error state is safely consumed via useSyncExternalStore in GlobalErrorProvider.
 *
 * Network errors are handled separately in GlobalErrorProvider via onlineManager.
 */
const queryCache = new QueryCache( {
	onError: error => {
		const currentError = globalErrorManager.getError();

		// Don't override network error (highest priority)
		if ( currentError === 'network' ) {
			return;
		}

		const status = getApiErrorStatus( error );

		if ( status === 401 ) {
			// Auth errors take precedence over server errors, but not network errors.
			if ( currentError !== 'auth' ) {
				globalErrorManager.setError( 'auth' );
			}
		} else if ( status === 502 || status === 503 || status === 504 ) {
			// Server errors: only set if no higher-priority error exists.
			if ( currentError !== 'auth' && currentError !== 'server' ) {
				globalErrorManager.setError( 'server' );
			}
		}
	},
	onSuccess: () => {
		// Clear transient server errors once queries start succeeding again.
		if ( globalErrorManager.getError() === 'server' ) {
			globalErrorManager.clearError();
		}
	},
} );

export const queryClient = new QueryClient( {
	queryCache,
	defaultOptions: {
		queries: {
			/*
			 * Stale time is the time after which the data
			 * is considered stale and a new request is made.
			 * Stale time: 5 minutes
			 */
			staleTime: DEFAULT_STALE_TIME,

			/*
			 * GC time is the time after which the data is considered garbage
			 * collected and removed from the cache.
			 * GC time: 10 minutes
			 */
			gcTime: DEFAULT_GC_TIME,

			/**
			 * Noop fetcher to prevent react-query errors for empty queries in console.
			 */
			queryFn: () => Promise.resolve( undefined ),

			/**
			 * 401/403 responses are deterministic for the current user/session.
			 * Retrying them keeps initial widgets in a loading state and delays the
			 * specific auth/plan-gated error UI.
			 */
			retry: shouldRetryApiError,
		},
	},
} );

export const AnalyticsQueryClientProvider = ( { children }: { children: ReactNode } ) => {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
};
