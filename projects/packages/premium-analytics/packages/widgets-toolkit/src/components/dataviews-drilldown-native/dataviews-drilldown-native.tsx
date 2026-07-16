/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './dataviews-drilldown-native.module.scss';
import { processHierarchyLevels } from './process-hierarchy-levels';
import type { Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
};

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
	getItemLevel?: ( item: Item ) => number;
	isLoading?: boolean;
	paginationInfo: PaginationInfo;
	defaultLayouts?: SupportedLayouts;
	empty?: ReactNode;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

export interface DataViewsDrilldownNativeProps< Item > {
	/** Flat rows: parents and children mixed; children carry a parent id. */
	data: Item[];
	/**
	 * DataViews field config. The first field in the view's field list becomes
	 * the view's `titleField` — the only column DataViews renders native
	 * hierarchy levels on.
	 */
	fields: Field< Item >[];
	/** Stable id per row. */
	getItemId: ( item: Item ) => string;
	/** Returns the parent row id for child rows, undefined for parent rows. */
	getItemParentId: ( item: Item ) => string | number | null | undefined;
	/** Initial view overrides (default sort, visible fields, page size, ...). */
	initialView?: Partial< View >;
	/**
	 * Hide the native em-dash level markers, leaving whitespace indentation.
	 * This is the one CSS override the native rendering leaves room for — the
	 * `dataviews-view-table__level` marker span ships unstyled upstream.
	 */
	hideLevelMarkers?: boolean;
	/** Show DataViews' loading state. */
	isLoading?: boolean;
	/** Accessible label for the search input. */
	searchLabel?: string;
	/** Custom empty state. */
	empty?: ReactNode;
	/** Page size choices. */
	perPageSizes?: number[];
}

/**
 * Render flat parent/child rows through DataViews' own hierarchy support and
 * nothing else: the rows are re-emitted in depth-first order, `getItemLevel`
 * reports each row's depth, and `view.showLevels` renders the level marker on
 * the view's `titleField`. There is no expand/collapse — DataViews' native
 * level rendering is a static display — and search, filters, sorting, and
 * pagination are DataViews' flat `filterSortAndPaginate` semantics, so
 * sorting by a field re-orders rows flat and visually breaks the hierarchy
 * grouping.
 *
 * @param props                  - The component props.
 * @param props.data             - Flat rows: parents and children mixed.
 * @param props.fields           - The DataViews field config.
 * @param props.getItemId        - Resolves stable row ids.
 * @param props.getItemParentId  - Resolves parent ids for child rows.
 * @param props.initialView      - Initial view overrides.
 * @param props.hideLevelMarkers - Hide the em-dash markers, keep indentation.
 * @param props.isLoading        - Show DataViews' loading state.
 * @param props.searchLabel      - Accessible label for the search input.
 * @param props.empty            - Custom empty state.
 * @param props.perPageSizes     - Page size choices.
 * @return The DataViews drilldown.
 */
export function DataViewsDrilldownNative< Item >( {
	data,
	fields,
	getItemId,
	getItemParentId,
	initialView,
	hideLevelMarkers = false,
	isLoading = false,
	searchLabel,
	empty,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: DataViewsDrilldownNativeProps< Item > ) {
	const [ view, setView ] = useState< View >( () => {
		const { fields: viewFieldIds, ...viewRest } = initialView ?? {};
		const [ titleField, ...columnFields ] = viewFieldIds ?? fields.map( field => field.id );

		return {
			type: 'table',
			page: 1,
			perPage: perPageSizes[ 0 ] ?? 10,
			search: '',
			showLevels: true,
			titleField,
			fields: columnFields,
			...viewRest,
		} as View;
	} );

	const { data: orderedData, levelById } = useMemo(
		() => processHierarchyLevels( data, getItemId, getItemParentId ),
		[ data, getItemId, getItemParentId ]
	);

	const { data: pageData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( orderedData, view, fields ),
		[ orderedData, view, fields ]
	);

	const getItemLevel = useCallback(
		( item: Item ) => levelById.get( getItemId( item ) ) ?? 0,
		[ levelById, getItemId ]
	);

	return (
		<div className={ clsx( styles.root, hideLevelMarkers && styles.hideLevelMarkers ) }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ pageData }
				getItemId={ getItemId }
				getItemLevel={ getItemLevel }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				empty={ empty }
				searchLabel={ searchLabel }
				config={ { perPageSizes } }
			/>
		</div>
	);
}
