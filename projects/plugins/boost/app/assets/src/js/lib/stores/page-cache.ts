import { useDataSync, useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const PageCacheError = z.string();

export function usePageCacheErrorDS() {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'page_cache_error', PageCacheError );

	return data;
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

	return useDataSyncAction<
		typeof PageCacheError,
		typeof responseSchema,
		typeof schema,
		z.infer< typeof schema >,
		z.infer< typeof responseSchema >,
		ModulesState
	>( {
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
