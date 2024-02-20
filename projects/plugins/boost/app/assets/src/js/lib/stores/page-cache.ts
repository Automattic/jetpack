import {
	invalidateQuery,
	useDataSync,
	useDataSyncAction,
} from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const PageCacheError = z.string();
export const PageCache = z.object( {
	bypassPatterns: z.array( z.string() ),
	logging: z.boolean(),
} );

export function usePageCacheErrorDS() {
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
	return usePageCacheErrorAction( 'run-page-cache-setup', z.void() );
}

function usePageCacheErrorAction<
	ActionSchema extends z.ZodSchema,
	ActionRequestData extends z.infer< ActionSchema >,
>( action: string, schema: ActionRequestData ) {
	const responseSchema = z.void();

	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache_error',
		action_name: action,
		schema: {
			state: PageCacheError,
			action_request: schema,
			action_response: responseSchema,
		},
	} );
}

// When page cache is enabled, page cache error needs to be invalidated,
// so we can get the updated error message from the last setup run.
export function invalidatePageCacheError() {
	invalidateQuery( 'page_cache_error' );
}
