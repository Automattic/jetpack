/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { getApiErrorStatus, shouldRetryApiError, StatsResponseShapeError } from '../utils';
import { globalErrorManager } from './global-error-manager';

// Everything below reads the HTTP status, which apiFetch drops on its way to
// throwing the parsed body. `fetchPreservingStatus()` restores it at its own
// call site; the queries still on bare apiFetch hit local WP REST routes, whose
// `WP_Error` bodies already carry `data.status`.

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

/**
 * QueryCache with global error detection for auth and server errors.
 *
 * Module level is safe: configuration rather than a side-effect subscription,
 * and QueryClient must be instantiated once.
 */
const queryCache = new QueryCache( {
	onError: error => {
		if ( error instanceof StatsResponseShapeError ) {
			// A response contract violation needs a developer-visible diagnostic;
			// the widget intentionally replaces the detail with user-safe copy.
			// eslint-disable-next-line no-console
			console.warn( `Unexpected Stats response: ${ error.message }` );
		}

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
			staleTime: DEFAULT_STALE_TIME,

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
