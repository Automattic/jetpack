/**
 * Internal dependencies
 */
import { DEFAULT_PER_PAGE_SIZES, GenericDataViews, useDataViewsTable } from '../data-views';
import { ReportPageSection } from './report-page-layout';
import styles from './report-records-table.module.scss';
import type { Action, Field, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

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
	const { view, setView, pageItems, paginationInfo } = useDataViewsTable( {
		data,
		fields,
		initialView,
		perPageSizes,
	} );

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
