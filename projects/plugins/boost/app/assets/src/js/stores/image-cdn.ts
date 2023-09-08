import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const imageCdnQualityClient = jetpack_boost_ds.createAsyncStore(
	'image_cdn_quality',
	z.object( {
		jpg: z.object( {
			lossless: z.boolean(),
			quality: z.number().int().min( 20 ).max( 100 ),
		} ),
		png: z.object( {
			lossless: z.boolean(),
			quality: z.number().int().min( 20 ).max( 100 ),
		} ),
		webp: z.object( {
			lossless: z.boolean(),
			quality: z.number().int().min( 20 ).max( 100 ),
		} ),
	} )
);
export const imageCdnQuality = imageCdnQualityClient.store;
