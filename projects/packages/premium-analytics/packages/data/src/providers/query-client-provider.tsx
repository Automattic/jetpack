/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
/**
 * Internal dependencies
 */
// Not the `../utils` barrel, which loads `@wordpress/core-data`.
import { getApiRetryDelay, shouldRetryApiError } from '../utils/api-error';

// Everything below reads the HTTP status, which apiFetch drops on its way to
// throwing the parsed body. `fetchPreservingStatus()` restores it at its own
// call site; the queries still on bare apiFetch hit local WP REST routes, whose
// `WP_Error` bodies already carry `data.status`.

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

export const queryClient = new QueryClient( {
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

			retryDelay: getApiRetryDelay,
		},
	},
} );

export const AnalyticsQueryClientProvider = ( { children }: { children: ReactNode } ) => {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
};
