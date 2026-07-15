/**
 * External dependencies
 */
import { DataViews } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import { DEFAULT_PER_PAGE_SIZES, GenericDataViews, useDataViewsTable } from '../data-views';
import './style.scss';
import styles from './style.module.scss';
import type { Field, View } from '@wordpress/dataviews';

export interface WidgetDataTableProps< Item > {
	/** All rows; sorting and pagination happen client-side. */
	data: Item[];
	/** DataViews field definitions, one per visible table column. */
	fields: Field< Item >[];
	/** Stable identifier for a row. */
	getItemId: ( item: Item ) => string;
	/** Initial sort, visible fields, page size, and other view overrides. */
	initialView?: Partial< View >;
	/** Whether to show DataViews search UI. */
	search?: boolean;
	/** Page-size choices. */
	perPageSizes?: number[];
}

/**
 * Compact Core DataViews table for dashboard widgets. Unlike the report-page
 * table, this component owns no card or section chrome; the widget host remains
 * responsible for the frame and title.
 *
 * Loading, error, and empty states belong to `<WidgetState>` around this table,
 * so it has no loading state of its own.
 *
 * @param {WidgetDataTableProps} props - The component props.
 * @return The rendered table.
 */
export function WidgetDataTable< Item >( {
	data,
	fields,
	getItemId,
	initialView,
	search = false,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: WidgetDataTableProps< Item > ) {
	const { view, setView, pageItems, paginationInfo } = useDataViewsTable( {
		data,
		fields,
		initialView,
		perPageSizes,
	} );

	return (
		<div className={ styles.root }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ pageItems }
				getItemId={ getItemId }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				search={ search }
				config={ { perPageSizes } }
			>
				{ search ? undefined : (
					<>
						<DataViews.Layout />
						<DataViews.Footer />
					</>
				) }
			</GenericDataViews>
		</div>
	);
}
