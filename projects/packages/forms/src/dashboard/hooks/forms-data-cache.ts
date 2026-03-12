/**
 * Invalidate all jetpack_form entity record resolutions.
 *
 * Call this after changing response status (trash, spam, restore, delete)
 * so the Forms list entries_count is refreshed.
 *
 * Uses invalidateResolutionForStoreSelector to clear all getEntityRecords
 * resolutions at once, avoiding the need to track individual queries.
 *
 * @param storeDispatch                                      - An object with invalidateResolutionForStoreSelector, typically
 *                                                           from registry.dispatch( coreStore ) or useDispatch( coreStore ).
 * @param storeDispatch.invalidateResolutionForStoreSelector - Clears all resolutions for a given selector.
 */
export function invalidateFormsDataResolutions( storeDispatch: {
	invalidateResolutionForStoreSelector: ( selector: string ) => void;
} ): void {
	storeDispatch.invalidateResolutionForStoreSelector( 'getEntityRecords' );
}

/**
 * Build the query object for fetching Forms list records from core-data.
 *
 * @param page    - Current page number.
 * @param perPage - Items per page.
 * @param search  - Search term.
 * @param status  - REST `status` query param (comma-separated list or single status).
 *
 * @return Query params for useEntityRecords / core-data.
 */
export function getFormsListQuery( page: number, perPage: number, search: string, status: string ) {
	const queryParams: Record< string, unknown > = {
		context: 'edit',
		jetpack_forms_context: 'dashboard',
		order: 'desc',
		orderby: 'modified',
		page,
		per_page: perPage,
		status,
	};

	if ( search ) {
		queryParams.search = search;
	}

	return queryParams;
}
