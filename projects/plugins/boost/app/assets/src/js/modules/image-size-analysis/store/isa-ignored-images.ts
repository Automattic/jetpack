import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { ImageData } from './zod-types';

const image_size_analysis_ignored_images = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_ignored_images',
	z.array( ImageData ).catch( [] )
);

export const isaIgnoredImages = image_size_analysis_ignored_images.store;

export function ignoreImage( imageID: string ) {
	image_size_analysis_ignored_images.store.update( value => {
		if ( value.find( image => image.id === imageID ) ) {
			return value;
		}
		return [ ...value, { id: imageID } ];
	} );
}

export function unignoreImage( imageID: string ) {
	image_size_analysis_ignored_images.store.update( value => {
		return value.filter( image => image.id !== imageID );
	} );
}
