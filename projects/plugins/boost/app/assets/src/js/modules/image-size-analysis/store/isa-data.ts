import { derived } from 'svelte/store';
import { useParams } from 'svelte-navigator';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { ImageData, ImageSizeAnalysis } from './zod-types';

/**
 * Initialize the stores
 */
const image_size_analysis = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis',
	ImageSizeAnalysis
);

/**
 * Export the stores
 */
export type ISA_Data = z.infer< typeof ImageData >;
export const isaData = image_size_analysis.store;
export const isaDataLoading = image_size_analysis.pending;

export const isaIgnoredImages = derived( [ isaData ], ( [ $data ] ) => {
	return $data.data.images.filter( image => image.status === 'ignored' ).map( image => image.id );
} );

export function updateIsaQuery( group: string, page = 1, search = '' ) {
	image_size_analysis.store.update( value => {
		return {
			...value,
			query: {
				group,
				page,
				search,
			},
		};
	} );
}

/**
 * Initialize the query params when the Recommendations Page component loads.
 * This is wrapped in a function because useParams() expects to be loaded from a component.
 */
export function initializeIsaData() {
	// Hook into the router to update the query params.
	const queryParams = useParams();
	queryParams.subscribe( $params => {
		updateIsaQuery( $params.group, parseInt( $params.page ), $params.search );
	} );
}

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

	// Send a request to the SET endpoint.
	const fresh = await image_size_analysis.endpoint.SET( value, signal );

	if ( signal.aborted ) {
		return prevValue;
	}

	// MOCKING:
	// Special case: If the querying the "ignored" group, pretend we got
	// a response with images that are ignored.
	if ( value.query.group === 'ignored' ) {
		for ( const image of fresh.data.images ) {
			image.status = 'ignored';
		}
	}

	// Override store value without triggering another SET request.
	image_size_analysis.store.override( fresh );
	return fresh;
} );
