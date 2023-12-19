import { useParams } from 'svelte-navigator';
import { IsaGlobal } from './types';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
/**
 * Initialize the stores
 */
export const isaDataDS = jetpack_boost_ds.createAsyncStore( 'image_size_analysis', IsaGlobal );

/**
 * Export the stores
 */

export const isaData = isaDataDS.store;
export const isaDataLoading = isaDataDS.pending;

export function updateIsaQuery( group: string, page = 1, search = '' ) {
	isaDataDS.store.update( value => {
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

async function maybeRefreshStore( prevValue: IsaGlobal, value: IsaGlobal, signal?: AbortSignal ) {
	if (
		prevValue.query.page === value.query.page &&
		prevValue.query.group === value.query.group &&
		prevValue.query.search === value.query.search
	) {
		return;
	}

	// Send a request to the SET endpoint.
	const fresh = await isaDataDS.endpoint.SET( value, signal );

	// If the request was aborted, return the original value.
	if ( signal?.aborted ) {
		return value;
	}
	// Override store value without triggering another SET request.
	isaDataDS.store.override( fresh );
}

isaDataDS.setSyncAction( async ( prevValue, value, signal ) => {
	// See if the query changed, if it did, update the store.
	await maybeRefreshStore( prevValue, value, signal );

	// SyncedStore expects a return value, but I think it needs a refactor,
	// because it's not really used anywhere.
	return value;
} );
