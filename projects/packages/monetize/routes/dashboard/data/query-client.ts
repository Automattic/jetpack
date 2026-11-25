import { QueryClient } from '@tanstack/react-query';
import { WpcomApiError } from './wpcom-request';

const MAX_RETRIES = 3;

/**
 * Retry only failures that might pass next time: a 4xx answer won't change.
 *
 * @param failureCount - Failures so far.
 * @param error        - The latest failure.
 * @return Whether to retry.
 */
export function shouldRetry( failureCount: number, error: unknown ): boolean {
	// apiFetch's own errors carry the status under `data`.
	const status =
		error instanceof WpcomApiError
			? error.status
			: ( error as { data?: { status?: number } } | null )?.data?.status;
	if ( status && status < 500 ) {
		return false;
	}
	return failureCount < MAX_RETRIES;
}

export const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: shouldRetry,
			staleTime: 30 * 1000,
		},
	},
} );
