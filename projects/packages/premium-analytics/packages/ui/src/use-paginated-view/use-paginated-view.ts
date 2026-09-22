/**
 * External dependencies
 */
import { filterSortAndPaginate, type Field, type View } from '@jetpack-premium-analytics/externals';
import { useEffect, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { clampPage } from './clamp-page';

export type PaginatedView< Item > = ReturnType< typeof filterSortAndPaginate< Item > > & {
	/** The view to hand DataViews — the caller's, or one clamped to a page that exists. */
	view: View;
};

/**
 * Client-side pagination that can't strand the reader past the end of a result.
 *
 * Hand the returned `view` to DataViews, not just the rows: it reads `view.page`
 * for its own controls. `setView` then writes the clamp back, or a later result
 * growing into range would restore the page the reader was stranded on.
 *
 * @param data    - Every row, before paging.
 * @param view    - The caller's view state.
 * @param fields  - The field definitions behind the view.
 * @param setView - Receives the clamped view, so the caller's state follows the screen.
 * @return The view to render, that page's rows, and the pagination summary.
 */
export function usePaginatedView< Item >(
	data: Item[],
	view: View,
	fields: Field< Item >[],
	setView: ( view: View ) => void
): PaginatedView< Item > {
	const result = useMemo( () => {
		const paginated = filterSortAndPaginate( data, view, fields );
		const page = clampPage( view.page ?? 1, paginated.paginationInfo.totalPages );

		if ( page === ( view.page ?? 1 ) ) {
			return { view, ...paginated };
		}

		const clampedView = { ...view, page };

		return { view: clampedView, ...filterSortAndPaginate( data, clampedView, fields ) };
	}, [ data, view, fields ] );

	useEffect( () => {
		if ( result.view !== view ) {
			setView( result.view );
		}
	}, [ result.view, view, setView ] );

	return result;
}
