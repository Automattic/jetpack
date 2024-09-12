import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useEffect, useState } from 'react';
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

// Use this hook to check if the cache engine not loading error notice should be shown.
export function useShowCacheEngineErrorNotice( moduleIsReady: boolean ) {
	const [ { data: cacheEngineLoading, refetch: recheckCacheEngine } ] = useDataSync(
		'jetpack_boost_ds',
		'cache_engine_loading',
		z.boolean()
	);

	const [ showCacheEngineErrorNotice, setShowCacheEngineErrorNotice ] = useState( false );

	useEffect( () => {
		( async () => {
			// By default, the notice should always be hidden.
			setShowCacheEngineErrorNotice( false );

			if ( moduleIsReady ) {
				await recheckCacheEngine();
				setShowCacheEngineErrorNotice( cacheEngineLoading === false );
			}
		} )();
	}, [ moduleIsReady, cacheEngineLoading, recheckCacheEngine ] );

	return showCacheEngineErrorNotice;
}
