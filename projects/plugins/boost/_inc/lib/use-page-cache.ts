import { z } from 'zod';
import { useDataSyncAction } from './use-data-sync-action';
import { useDataSyncEntry } from './use-data-sync-entry';

const pageCacheSchema = z.object( {
	bypass_patterns: z.array( z.string() ),
	logging: z.boolean(),
} );

const pageCacheErrorSchema = z
	.object( {
		code: z.string(),
		message: z.string(),
		dismissed: z.boolean(),
	} )
	.nullable();

export type PageCacheSettings = z.infer< typeof pageCacheSchema >;
export type PageCacheError = z.infer< typeof pageCacheErrorSchema >;

/**
 * Reads + writes the Page Cache settings entry — bypass patterns
 * (regex list) and the logging toggle. Pairs with the per-module
 * `page_cache` toggle in modules_state (which gates whether the
 * cache is active in the first place).
 *
 * @return Tuple of `[ query, mutation ]`.
 */
export function usePageCacheSettings() {
	return useDataSyncEntry( 'page_cache', pageCacheSchema, {
		staleTime: 5 * 60 * 1000,
	} );
}

/**
 * Reads the latest page-cache setup error (cache engine misconfig,
 * /boost-cache not writable, conflicting cache plugin, etc.). May be
 * `null` when the cache is healthy.
 *
 * @return Tuple of `[ query, mutation ]` so the dismiss flag can be
 *         updated when the user dismisses the error notice.
 */
export function usePageCacheError() {
	return useDataSyncEntry( 'page_cache_error', pageCacheErrorSchema, {
		staleTime: 60 * 1000,
	} );
}

const voidSchema = z.unknown().nullable().optional();

/**
 * Fires the page-cache `run-setup` action — provisioning the cache
 * engine, writing advanced-cache.php, etc.
 *
 * @return The setup mutation.
 */
export function useRunPageCacheSetup() {
	return useDataSyncAction( 'page_cache', 'run-setup', voidSchema, [
		[ 'jetpack_boost_ds', 'page_cache' ],
		[ 'jetpack_boost_ds', 'page_cache_error' ],
		[ 'jetpack_boost_modules_state' ],
	] );
}

/**
 * Fires the page-cache `clear-page-cache` action — drops all
 * currently-cached pages.
 *
 * @return The clear-cache mutation.
 */
export function useClearPageCache() {
	return useDataSyncAction( 'page_cache', 'clear-page-cache', voidSchema, [
		[ 'jetpack_boost_ds', 'page_cache' ],
	] );
}
