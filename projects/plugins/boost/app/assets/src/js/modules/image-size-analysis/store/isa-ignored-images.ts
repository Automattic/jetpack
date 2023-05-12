import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { ImageData } from './zod-types';

const image_size_analysis_ignored_images = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_ignored_images',
	z.array( ImageData ).catch( [] )
);

export const isaIgnoredImages = image_size_analysis_ignored_images.store;
