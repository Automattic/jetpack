import { standardizeError } from '$lib/utils/standardize-error';
import {
	DataSyncError,
	useDataSync,
	useDataSyncAction,
} from '@automattic/jetpack-react-data-sync-client';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export const PageCacheError = z
	.object( {
		code: z.string(),
		message: z.string(),
	} )
	.nullable();

export const PageCache = z.object( {
	bypass_patterns: z.array( z.string() ),
	logging: z.boolean(),
} );
const PageCacheClear = z.object( {
	message: z.string(),
} );

export function usePageCacheError() {
	return useDataSync( 'jetpack_boost_ds', 'page_cache_error', PageCacheError );
}

export function usePageCache() {
	return useDataSync( 'jetpack_boost_ds', 'page_cache', PageCache );
}

/**
 * Hook which creates a callable action for running Page Cache setup.
 */
export function usePageCacheSetup() {
	const [ pageCacheError, pageCacheErrorMutation ] = usePageCacheError();
	const setError = pageCacheErrorMutation.mutate;

	const pageCacheSetup = useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'run-setup',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheError.or( z.literal( true ) ),
		},
	} );

	// If cache setup encounters an error,
	// standardize it and set it to the Page Cache Error store.
	useEffect( () => {
		if ( pageCacheSetup.isError && pageCacheSetup.error ) {
			if ( pageCacheSetup.error instanceof DataSyncError ) {
				return setError( pageCacheSetup.error.info() );
			}
			const standardizedError = standardizeError( pageCacheSetup.error );
			setError( {
				code: 'unknown_error',
				message: standardizedError.message || 'Unknown error occurred.',
			} );
		}
	}, [ pageCacheSetup.isError, pageCacheSetup.error, setError ] );

	// If cache setup is successful, clear the error.
	useEffect( () => {
		if ( pageCacheSetup.isSuccess ) {
			setError( null );
		}
	}, [ pageCacheSetup.isSuccess, setError ] );

	return [ pageCacheSetup, pageCacheError ] as const;
}

/**
 * Hook which creates a callable action for clearing Page Cache.
 */
export function useClearPageCacheAction() {
	const [ message, setMessage ] = useState( '' );
	const action = useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'clear-page-cache',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheClear,
		},
		callbacks: {
			onResult: result => {
				if ( result.message ) {
					setMessage( result.message );
				}
			},
		},
	} );

	return [ message, action ] as const;
}
