import {
	invalidateQuery,
	useDataSync,
	useDataSyncAction,
} from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const PageCacheError = z.string();
export const PageCache = z.object( {
	bypass_patterns: z.array( z.string() ),
	logging: z.boolean(),
} );
const PageCacheClear = z.object( {
	message: z.string(),
} );

export function usePageCacheError() {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'page_cache_error', PageCacheError );

	return data;
}

export function usePageCache() {
	return useDataSync( 'jetpack_boost_ds', 'page_cache', PageCache );
}

/**
 * Hook which creates a callable action for running Page Cache setup.
 */
export function useRunPageCacheSetupAction() {
	const action = 'run-page-cache-setup';
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache_error',
		action_name: action,
		schema: {
			state: PageCacheError,
			action_request: z.void(),
			action_response: z.void(),
		},
	} );
}

/**
 * Hook which creates a callable action for clearing Page Cache.
 */
export function useClearPageCacheAction() {
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'clear-page-cache',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheClear,
		},
	} );
}

// When page cache is enabled, page cache error needs to be invalidated,
// so we can get the updated error message from the last setup run.
export function invalidatePageCacheError() {
	invalidateQuery( 'page_cache_error' );
}
