import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';

/**
 * Zod Types
 */
const Dimensions = z.object( {
	width: z.number(),
	height: z.number(),
} );

const ImageData = z.object( {
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

const ImageSizeAnalysis = z
	.object( {
		query: z.object( {
			page: z.number(),
			group: z.string(),
			search: z.string(),
		} ),
		data: z.object( {
			last_updated: z.number(),
			total_pages: z.number(),
			images: z.array( ImageData ),
		} ),
	} )
	// Prevent fatal error when this module isn't available.
	.catch( {
		query: {
			page: 1,
			group: 'all',
			search: '',
		},
		data: {
			last_updated: 0,
			total_pages: 0,
			images: [],
		},
	} );

/**
 * Initialize the stores
 */
const image_size_analysis = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis',
	ImageSizeAnalysis
);

/**
 * Customize the stores where necessary
 */
image_size_analysis.setSyncAction( async ( prevValue, value, signal ) => {
	// Only query values are writable.
	if (
		prevValue.query.page === value.query.page &&
		prevValue.query.group === value.query.group &&
		prevValue.query.search === value.query.search
	) {
		return prevValue;
	}
	// Send a request to the SET endpoint.
	const fresh = await image_size_analysis.endpoint.SET( value, signal );
	if ( signal.aborted ) {
		return prevValue;
	}
	// Override store value without triggering another SET request.
	image_size_analysis.store.override( fresh );
	return fresh;
} );

/**
 * Export the stores
 */
export type ImageSizeAnalysisData = z.infer< typeof ImageData >;
export const imageData = image_size_analysis.store;
export const imagesAreLoading = image_size_analysis.pending;
