import { z } from 'zod';
import { useDataSyncEntry } from './use-data-sync-entry';

const formatQualitySchema = z.object( {
	quality: z.number(),
	lossless: z.boolean(),
} );

const imageCdnQualitySchema = z.object( {
	jpg: formatQualitySchema,
	png: formatQualitySchema,
	webp: formatQualitySchema,
} );

export type ImageCdnQuality = z.infer< typeof imageCdnQualitySchema >;
export type ImageFormatQuality = z.infer< typeof formatQualitySchema >;
export type ImageFormatKey = 'jpg' | 'png' | 'webp';

/**
 * Reads + writes the per-format Image CDN quality settings. Each
 * format ships its own `quality` (a number) and `lossless` (a
 * boolean) — Boost uses these to tune the `quality=` arg appended to
 * Photon URLs.
 *
 * @return Tuple of `[ query, mutation ]`.
 */
export function useImageCdnQuality() {
	return useDataSyncEntry( 'image_cdn_quality', imageCdnQualitySchema, {
		staleTime: 5 * 60 * 1000,
	} );
}
