import { derived } from 'svelte/store';
import { useParams } from 'svelte-navigator';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { isaIgnoredImages } from './isa-ignored-images';
import { ImageData, ImageSizeAnalysis } from './zod-types';

/**
 * Initialize the stores
 */
const image_size_analysis = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis',
	ImageSizeAnalysis
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
	[ image_size_analysis.store, isaIgnoredImages ],
	( [ $data, $ignored ] ) => {
		if ( $data.query.group === 'ignored' ) {
			return $ignored;
		}
		return $data.data.images.filter( image => ! $ignored.find( ignore => ignore.id === image.id ) );
	}
);

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
 * Export the stores
 */
export type ISA_Data = z.infer< typeof ImageData >;
export const isaData = image_size_analysis.store;
export const isaDataLoading = derived(
	[ image_size_analysis.pending, isaData ],
	( [ $pending, $data ] ) => {
		// Special case for ignored since that's currently handled by a different store.
		// Ultimately, I think "ignored" is going back to the main store.
		// because it too is stored over the network.
		return $data.query.group !== 'ignored' && ( $pending || $data.data.images.length === 0 );
	}
);
