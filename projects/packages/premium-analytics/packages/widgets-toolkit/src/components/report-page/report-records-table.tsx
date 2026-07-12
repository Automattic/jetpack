/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { ReportPageSection } from './report-page-layout';
import styles from './report-records-table.module.scss';
import type { Action, Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

/**
 * `DataViews`' own `getItemId` prop is conditionally optional on `Item` having
 * an `id: string`, which TypeScript cannot discharge for an unresolved
 * generic. This table always requires `getItemId`, so erase the conditional
 * behind an alias that reflects that.
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
	actions?: Action< Item >[];
	empty?: ReactNode;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

export interface ReportRecordsTableProps< Item > {
	/** All records for the current report and range; paging/search/sort happen client-side. */
	data: Item[];
	/** The DataViews field config — one entry per column. */
	fields: Field< Item >[];
	/** Stable id per record (post ID, country code, search term, …). */
	getItemId: ( item: Item ) => string;
	/** Initial view overrides (default sort, visible fields, page size, …). */
	initialView?: Partial< View >;
	/** Show DataViews' loading state. */
	isLoading?: boolean;
	/** Accessible label for the search input. */
	searchLabel?: string;
	/** Optional row actions. */
	actions?: Action< Item >[];
	/** Custom empty state. */
	empty?: ReactNode;
	/** Page size choices (defaults to 10/25/50/100). */
	perPageSizes?: number[];
}

/**
 * The report page's records table: a Core DataViews table (search, sortable +
 * configurable columns, pagination) over the module's normalized report rows.
 * Filtering, sorting, and pagination run client-side via
 * `filterSortAndPaginate` — report modules return the full summarized list for
 * the selected range, so no server round-trip is needed.
 *
 * The module page supplies the data and field config; this owns the view
 * state, so every report table behaves the same.
 *
 * @param {ReportRecordsTableProps} props - The component props.
 * @return The records table section.
 */
export function ReportRecordsTable< Item >( {
	data,
	fields,
	getItemId,
	initialView,
	isLoading = false,
	searchLabel,
	actions,
	empty,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: ReportRecordsTableProps< Item > ) {
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

	return (
		<ReportPageSection className={ styles.root }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ pageItems }
				getItemId={ getItemId }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				actions={ actions }
				empty={ empty }
				searchLabel={ searchLabel }
				config={ { perPageSizes } }
			/>
		</ReportPageSection>
	);
}
