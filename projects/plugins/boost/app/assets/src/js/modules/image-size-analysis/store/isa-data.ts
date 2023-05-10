import { onMount } from 'svelte';
import { derived } from 'svelte/store';
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
	id: z.string(),
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
	edit_url: z
		.string()
		.url()
		// Not sure where &amp; is coming from, but it's breaking the link.
		.transform( url => url.replace( '&amp;', '&' ) ),
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
			page: 0,
			group: '',
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

const image_size_analysis_ignored_images = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_ignored_images',
	z.array( ImageData ).catch( [] )
);

/**
 * Only the following values are "writable":
 * * query.page
 * * query.group
 * * query.search
 */
image_size_analysis.setSyncAction( async ( prevValue, value, signal ) => {
	if (
		prevValue.query.page === value.query.page &&
		prevValue.query.group === value.query.group &&
		prevValue.query.search === value.query.search
	) {
		return prevValue;
	}

	// Don't issue new requests if the group is "ignored".
	// The derived store will handle this.
	if ( value.query.group === 'ignored' ) {
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

export const isaFilteredImages = derived(
	[ image_size_analysis.store, image_size_analysis_ignored_images.store ],
	( [ $data, $ignored ] ) => {
		if ( $data.query.group === 'ignored' ) {
			return $ignored;
		}
		return $data.data.images.filter( image => ! $ignored.find( ignore => ignore.id === image.id ) );
	}
);

/**
 * Export the stores
 */
export type ISA_Data = z.infer< typeof ImageData >;
export const isaData = image_size_analysis.store;
export const isaDataLoading = derived(
	[ image_size_analysis.pending, isaData ],
	( [ $pending, $data ] ) => $pending || $data.data.images.length === 0
);
export const isaIgnoredImages = image_size_analysis_ignored_images.store;
