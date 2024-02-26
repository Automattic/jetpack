import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

/**
 * Hook for reading Debug Logs. Is automatically kept up-to-date with 10 second refreshes.
 */
export function useDebugLog() {
	return useDataSync( 'jetpack_boost_ds', 'cache_debug_log', z.string(), {
		query: {
			// Keep refreshing the logs every 10 seconds
			refetchInterval: 10000,
		},
	} );
}
