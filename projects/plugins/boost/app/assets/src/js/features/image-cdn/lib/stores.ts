import { DataSync, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import { useCallback } from 'react';
import { useDebounce } from '$lib/utils/debounce';

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
export type ImageFormat = keyof ImageCdnSettings;

const mutationFn = ( value: ImageCdnSettings ) => {
	const datasync = new DataSync( 'jetpack_boost_ds', 'image_cdn_quality', imageCdnSettingsSchema );
	return datasync.SET( value );
};

export function useImageCdnQuality(
	format: ImageFormat
): [ QualityConfig, ( newValue: QualityConfig ) => void ] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'image_cdn_quality',
		imageCdnSettingsSchema,
		{
			mutation: {
				mutationFn: useDebounce( mutationFn, 500 ),
			},
		}
	);

	if ( ! data ) {
		throw new Error( 'Image CDN Quality not loaded' );
	}

	const updateFormatQuantity = useCallback(
		( newValue: QualityConfig ) => {
			mutate( { ...data, [ format ]: newValue } );
		},
		[ data, format, mutate ]
	);

	return [ data[ format ], updateFormatQuantity ];
}
