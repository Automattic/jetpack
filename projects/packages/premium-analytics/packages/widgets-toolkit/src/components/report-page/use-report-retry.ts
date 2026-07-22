/**
 * External dependencies
 */
import { useCallback } from 'react';

/**
 * Create a stable retry callback for a report refetch function.
 *
 * @param refetch - The report refetch function.
 * @return A callback that retries the report request.
 */
export function useReportRetry( refetch: () => unknown ): () => void {
	return useCallback( () => {
		void refetch();
	}, [ refetch ] );
}
