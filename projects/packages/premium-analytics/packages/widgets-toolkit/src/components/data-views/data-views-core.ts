/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import type { Action, Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

export const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

/**
 * `DataViews`' own `getItemId` prop is conditionally optional on `Item` having
 * an `id: string`, which TypeScript cannot discharge for an unresolved
 * generic. Both toolkit tables always require `getItemId`, so erase the
 * conditional behind an alias that reflects that.
 */
export const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts?: SupportedLayouts;
	actions?: Action< Item >[];
	empty?: ReactNode;
	search?: boolean;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
	children?: ReactNode;
} ) => ReturnType< typeof DataViews >;

interface UseDataViewsTableOptions< Item > {
	data: Item[];
	fields: Field< Item >[];
	initialView?: Partial< View >;
	perPageSizes: number[];
}

/**
 * Owns a table's client-side view state and the page of rows derived from it,
 * so every toolkit table sorts, searches, and paginates the same way. Report
 * modules return the full list for the selected range, so no server round-trip
 * is needed.
 *
 * @param options              - The table's data and view configuration.
 * @param options.data         - All rows for the current report and range.
 * @param options.fields       - The field config, one entry per column.
 * @param options.initialView  - Initial sort, visible fields, page size, and other overrides.
 * @param options.perPageSizes - The page-size choices; the first is the initial page size.
 * @return The current view, its setter, the visible page of rows, and pagination info.
 */
export function useDataViewsTable< Item >( {
	data,
	fields,
	initialView,
	perPageSizes,
}: UseDataViewsTableOptions< Item > ) {
	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				perPage: perPageSizes[ 0 ] ?? 10,
				search: '',
				// DataViews renders only the columns listed in `view.fields` —
				// there is no "all fields" default — so seed it with every
				// configured field. `initialView` can still narrow it.
				fields: fields.map( field => field.id ),
				...initialView,
			} ) as View
	);

	const { data: pageItems, paginationInfo } = useMemo(
		() => filterSortAndPaginate( data, view, fields ),
		[ data, view, fields ]
	);

	return { view, setView, pageItems, paginationInfo };
}
