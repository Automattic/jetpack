import { z } from 'zod';

export const qualityConfigSchema = z.object( {
	lossless: z.boolean(),
	quality: z.number().int().min( 20 ).max( 100 ),
} );

export const imageCdnSettingsSchema = z.object( {
	jpg: qualityConfigSchema,
	png: qualityConfigSchema,
	webp: qualityConfigSchema,
} );

export type ImageCdnSettings = z.infer< typeof imageCdnSettingsSchema >;
export type QualityConfig = z.infer< typeof qualityConfigSchema >;
