import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const superCacheNoticeDisabledClient = jetpack_boost_ds.createAsyncStore(
	'super_cache_notice_disabled',
	z.boolean()
);

export const superCacheNoticeDisabledClientStore = superCacheNoticeDisabledClient.store;
