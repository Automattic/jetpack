/**
 * External dependencies
 */
import { filterSortAndPaginate, type Field, type View } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { clampPage } from './clamp-page';

export interface PaginatedView< Item > {
	/** The view to hand DataViews — the caller's, or one clamped to a page that exists. */
	view: View;
	data: Item[];
	paginationInfo: { totalItems: number; totalPages: number };
}

/**
 * Client-side pagination that can't strand the reader past the end of a result.
 *
 * A table's page survives a refetch, so a smaller result can leave it out of
 * range; `filterSortAndPaginate` then slices blindly and the table goes blank.
 * Pass the returned `view` down rather than only the rows: DataViews reads
 * `view.page` for its own controls, and `onChangeView` brings the caller's state
 * back in line as soon as the reader touches one.
 *
 * @param data   - Every row, before paging.
 * @param view   - The caller's view state.
 * @param fields - The field definitions behind the view.
 * @return The view to render, that page's rows, and the pagination summary.
 */
export function usePaginatedView< Item >(
	data: Item[],
	view: View,
	fields: Field< Item >[]
): PaginatedView< Item > {
	return useMemo( () => {
		const result = filterSortAndPaginate( data, view, fields );
		const page = clampPage( view.page ?? 1, result.paginationInfo.totalPages );

		if ( page === ( view.page ?? 1 ) ) {
			return { view, data: result.data, paginationInfo: result.paginationInfo };
		}

		const clampedView = { ...view, page };
		const clamped = filterSortAndPaginate( data, clampedView, fields );

		return {
			view: clampedView,
			data: clamped.data,
			paginationInfo: clamped.paginationInfo,
		};
	}, [ data, view, fields ] );
}
