import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const PageCacheError = z.string();

export function usePageCacheErrorDS() {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'page_cache_error', PageCacheError );

	return data;
}
