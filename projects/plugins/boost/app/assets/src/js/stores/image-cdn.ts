import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

const imageCdnQualitySchema = z.object( {
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
} );

export const imageCdnQualityClient = jetpack_boost_ds.createAsyncStore(
	'image_cdn_quality',
	imageCdnQualitySchema
);

export type ImageCdnQuality = z.infer< typeof imageCdnQualitySchema >;
export const imageCdnQuality = imageCdnQualityClient.store;
