import { useParams } from 'svelte-navigator';
import { z } from 'zod';
import { ImageData, ImageSizeAnalysis, emptyImageSizeAnalysisData } from './zod-types';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';

/**
 * Initialize the stores
 */
export const image_size_analysis = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis',
	ImageSizeAnalysis
);

/**
 * Export the stores
 */
export type ISA_Data = z.infer< typeof ImageData >;
export const isaData = image_size_analysis.store;
export const isaDataLoading = image_size_analysis.pending;

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
 * Whenever a new report is requested, clear the search results from the store otherwise
 * it might show old data when you visit the table view.
 */
export function resetIsaQuery() {
	image_size_analysis.store.override( emptyImageSizeAnalysisData );
}

type ISA = z.infer< typeof ImageSizeAnalysis >;

async function maybeRefreshStore( prevValue: ISA, value: ISA, signal?: AbortSignal ) {
	if (
		prevValue.query.page === value.query.page &&
		prevValue.query.group === value.query.group &&
		prevValue.query.search === value.query.search
	) {
		return;
	}

	// Send a request to the SET endpoint.
	const fresh = await image_size_analysis.endpoint.SET( value, signal );

	// If the request was aborted, return the original value.
	if ( signal?.aborted ) {
		return value;
	}
	// Override store value without triggering another SET request.
	image_size_analysis.store.override( fresh );
}

image_size_analysis.setSyncAction( async ( prevValue, value, signal ) => {
	// See if the query changed, if it did, update the store.
	await maybeRefreshStore( prevValue, value, signal );

	// SyncedStore expects a return value, but I think it needs a refactor,
	// because it's not really used anywhere.
	return value;
} );
