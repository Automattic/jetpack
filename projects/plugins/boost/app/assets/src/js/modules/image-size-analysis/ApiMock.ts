import { writable } from 'svelte/store';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../stores/data-sync-client';

const Dimensions = z.object( {
	width: z.number(),
	height: z.number(),
} );

const ImageMeta = z.object( {
	thumbnail: z.string(),
	image: z.object( {
		url: z.string(),
		dimensions: z.object( {
			file: Dimensions,
			expected: Dimensions,
			size_on_screen: Dimensions,
		} ),
		weight: z.object( {
			current: z.number(),
			potential: z.number(),
		} ),
	} ),
	page: z.object( {
		id: z.number(),
		url: z.string(),
		title: z.string(),
	} ),
	device_type: z.enum( [ 'phone', 'desktop' ] ),
	instructions: z.string(),
} );

const ImageSizeAnalysis = z.object( {
	pagination: z.object( {
		current: z.number().catch( 1 ),
		total: z.number().catch( 1 ),
	} ),
	last_updated: z.number(),
	images: z.array( ImageMeta ),
} );

type CategoryState = {
	name: string;
	progress: number;
	issues?: number;
	done: boolean;
};

export const categories = writable< CategoryState[] >( [
	{
		name: 'Homepage',
		progress: 100,
		issues: 2,
		done: true,
	},
	{
		name: 'Pages',
		progress: 100,
		issues: 0,
		done: true,
	},
	{
		name: 'Posts',
		progress: 37,
		issues: 4,
		done: false,
	},
	{
		name: 'Other',
		progress: 0,
		// issues: 0, leaving intentionally undefined
		done: false,
	},
] );
export type Dimensions = { width: number; height: number };
export type ImageMeta = z.infer< typeof ImageMeta >;

const imageMeta = jetpack_boost_ds.createAsyncStore( 'image_size_analysis', ImageSizeAnalysis );
// imageMeta.setSyncAction( async ( prevValue, value, signal ) => {
// 	const fresh = await imageMeta.endpoint.SET( value, signal );
// 	if ( signal.aborted ) {
// 		return prevValue;
// 	}
// 	imageMeta.store.override( fresh );
// 	return value;
// } );
export const imageStore = imageMeta.store;
export const imagesAreLoading = imageMeta.pending;
