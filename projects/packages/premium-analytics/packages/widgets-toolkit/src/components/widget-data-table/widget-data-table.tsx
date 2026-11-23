/**
 * External dependencies
 */
import {
	DataViews,
	type Action,
	type Field,
	type SupportedLayouts,
	type View,
} from '@jetpack-premium-analytics/externals';
import { usePaginatedView } from '@jetpack-premium-analytics/ui';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import styles from './style.module.scss';
import type { ReactNode } from 'react';

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
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts?: SupportedLayouts;
	actions?: Action< Item >[];
	search?: boolean;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
	children?: ReactNode;
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
	/** Whether to show DataViews search UI. */
	search?: boolean;
	/** Accessible label for the search input. */
	searchLabel?: string;
	/** Row actions; each one's `isEligible` decides which rows offer it. */
	actions?: Action< Item >[];
	/** Page-size choices. */
	perPageSizes?: number[];
	/** Called with the rows of the page on screen. */
	onChangePageItems?: ( items: Item[] ) => void;
}

/**
 * Compact Core DataViews table for dashboard widgets. Unlike the report-page
 * table, this component owns no card or section chrome; the widget host remains
 * responsible for the frame and title.
 *
 * Loading, error, and empty states belong to the `<WidgetState>` around this
 * table, so it has no loading state of its own.
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
	searchLabel,
	actions,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
	onChangePageItems,
}: WidgetDataTableProps< Item > ) {
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

	const {
		view: effectiveView,
		data: pageItems,
		paginationInfo,
	} = usePaginatedView( data, view, fields, setView );

	useEffect( () => {
		onChangePageItems?.( pageItems );
	}, [ onChangePageItems, pageItems ] );

	return (
		<div className={ styles.root }>
			<GenericDataViews< Item >
				view={ effectiveView }
				onChangeView={ setView }
				fields={ fields }
				data={ pageItems }
				getItemId={ getItemId }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				actions={ actions }
				search={ search }
				searchLabel={ searchLabel }
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
