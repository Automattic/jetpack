import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const imageCdnQualityClient = jetpack_boost_ds.createAsyncStore(
	'image_cdn_quality',
	z.number().int().min( 1 ).max( 100 )
);
export const imageCdnQuality = imageCdnQualityClient.store;
