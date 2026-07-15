/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import type { Field, SupportedLayouts, View } from '@wordpress/dataviews';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

/**
 * DataViews makes `getItemId` conditionally optional when an item has a string
 * `id`. This wrapper always requires it, so its generic contract stays stable.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts?: SupportedLayouts;
	search?: boolean;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

export interface WidgetDataTableProps< Item > {
	/** All rows; sorting and pagination happen client-side. */
	data: Item[];
	/** DataViews field definitions, one per visible table column. */
	fields: Field< Item >[];
	/** Stable identifier for a row. */
	getItemId: ( item: Item ) => string;
	/** Initial sort, visible fields, page size, and other view overrides. */
	initialView?: Partial< View >;
	/** Whether the table is loading. */
	isLoading?: boolean;
	/** Whether to show DataViews search UI. */
	search?: boolean;
	/** Page-size choices. */
	perPageSizes?: number[];
}

/**
 * Compact Core DataViews table for framed dashboard widgets. Unlike the
 * report-page table, this component owns no card or section chrome; the widget
 * host remains responsible for the frame and title.
 *
 * @param {WidgetDataTableProps} props - The component props.
 * @return The rendered table.
 */
export function WidgetDataTable< Item >( {
	data,
	fields,
	getItemId,
	initialView,
	isLoading = false,
	search = false,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: WidgetDataTableProps< Item > ) {
	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				perPage: perPageSizes[ 0 ] ?? 10,
				search: '',
				fields: fields.map( field => field.id ),
				...initialView,
			} ) as View
	);

	const { data: pageItems, paginationInfo } = useMemo(
		() => filterSortAndPaginate( data, view, fields ),
		[ data, view, fields ]
	);

	return (
		<div className={ styles.root }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ pageItems }
				getItemId={ getItemId }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				search={ search }
				config={ { perPageSizes } }
			/>
		</div>
	);
}
