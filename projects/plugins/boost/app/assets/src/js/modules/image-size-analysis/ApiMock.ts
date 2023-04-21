import { initializeClient } from '@automattic/jetpack-svelte-data-sync-client';
import { readable, writable } from 'svelte/store';
import { z } from 'zod';

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

const client = initializeClient( 'jetpack_boost_ds' );
const imageMeta = client.createAsyncStore( 'image_size_analysis', z.array( ImageMeta ) );

export const imageStore = imageMeta.store;
