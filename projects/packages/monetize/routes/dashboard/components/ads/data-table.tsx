import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useMemo, useState } from 'react';
import type { Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

// DataViews types `getItemId` conditionally on `Item`, which TypeScript can't resolve for a generic.
const TableViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts: SupportedLayouts;
	search: boolean;
	children: ReactNode;
} ) => ReturnType< typeof DataViews >;

/**
 * A read-only, paginated table of already-loaded rows.
 *
 * @param props           - Component props.
 * @param props.data      - The rows, in display order.
 * @param props.fields    - One field per column.
 * @param props.getItemId - A row's unique id.
 * @param props.perPage   - Rows per page.
 * @return The table.
 */
export default function DataTable< Item >( {
	data,
	fields,
	getItemId,
	perPage = 12,
}: {
	data: Item[];
	fields: Field< Item >[];
	getItemId: ( item: Item ) => string;
	perPage?: number;
} ) {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage,
		fields: fields.map( field => field.id ),
		layout: {},
	} );

	// Not sortable or hideable: the column header menus would offer nothing.
	const columns = useMemo(
		() => fields.map( field => ( { enableSorting: false, enableHiding: false, ...field } ) ),
		[ fields ]
	);
	const page = useMemo(
		() => filterSortAndPaginate( data, view, columns ),
		[ data, view, columns ]
	);

	// Only the table and its pagination: no search, filters or view settings.
	return (
		<div className="jp-monetize-ads__table">
			<TableViews< Item >
				data={ page.data }
				fields={ columns }
				view={ view }
				onChangeView={ setView }
				getItemId={ getItemId }
				paginationInfo={ page.paginationInfo }
				defaultLayouts={ { table: {} } }
				search={ false }
			>
				<DataViews.Layout />
				<DataViews.Pagination />
			</TableViews>
		</div>
	);
}
