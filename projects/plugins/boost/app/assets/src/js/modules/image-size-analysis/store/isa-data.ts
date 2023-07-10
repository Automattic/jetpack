import { derived } from 'svelte/store';
import { useParams } from 'svelte-navigator';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { ImageData, ImageSizeAnalysis, emptyImageSizeAnalysisData } from './zod-types';

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

export function refreshIsaData() {
	image_size_analysis.refresh();
}

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

	// MOCKING:
	// Special case: If the querying the "ignored" group, pretend we got
	// a response with images that are ignored.
	if ( value.query.group === 'ignored' ) {
		for ( const image of fresh.data.images ) {
			image.status = 'ignored';
		}
	}

	// If the request was aborted, return the original value.
	if ( signal.aborted ) {
		return value;
	}
	// Override store value without triggering another SET request.
	image_size_analysis.store.override( fresh );
}

async function maybeIgnoreImage( prevValue: ISA, value: ISA, _signal?: AbortSignal ) {
	// Find which value status has changed (if the user clicked ignore)
	const changedImage = value.data.images.find( image => {
		const prevImage = prevValue.data.images.find( prev => prev.id === image.id );
		return prevImage && prevImage.status !== image.status;
	} );

	if ( ! changedImage ) {
		return;
	}

	// @TODO: Ignore the image in the API.
	const prevImage = prevValue.data.images.find( prev => prev.id === changedImage.id );
	// eslint-disable-next-line no-console
	console.log(
		`Changing image status from "${ prevImage.status }" to "${ changedImage.status }" for image ID: ${ changedImage.id }`
	);
	// await fetch(.........);
	// There's no need to update the store after this, because
	// the element is already hidden in the UI.
}

image_size_analysis.setSyncAction( async ( prevValue, value, signal ) => {
	// See if the query changed, if it did, update the store.
	await maybeRefreshStore( prevValue, value, signal );

	// See if any images were ignored, if they were, send a request to the API.
	await maybeIgnoreImage( prevValue, value, signal );

	// SyncedStore expects a return value, but I think it needs a refactor,
	// because it's not really used anywhere.
	return value;
} );
