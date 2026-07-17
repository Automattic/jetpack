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
import type { Field, SupportedLayouts, View, ViewBaseProps } from '@wordpress/dataviews';
import type { ComponentProps, ReactNode } from 'react';

// Inferred props types from the `DataViews` component.
type PaginationInfo = ComponentProps< typeof DataViews >[ 'paginationInfo' ];
type OnChangeViewBaseProps< Item > = ViewBaseProps< Item >[ 'onChangeView' ];
type GetItemIdBaseProps< Item > = ViewBaseProps< Item >[ 'getItemId' ];
type GetItemLevelBaseProps< Item > = ViewBaseProps< Item >[ 'getItemLevel' ];

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

/**
 * `DataViews`' own `getItemId` prop is conditionally optional on `Item` having
 * an `id: string`, which TypeScript cannot discharge for an unresolved
 * generic. This table always requires `getItemId`, so erase the conditional
 * behind an alias that reflects that.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: OnChangeViewBaseProps< Item >;
	fields: Field< Item >[];
	data: Item[];
	getItemId: GetItemIdBaseProps< Item >;
	getItemLevel?: GetItemLevelBaseProps< Item >;
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
	getItemId: GetItemIdBaseProps< Item >;
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
 * @param {DataViewsDrilldownNativeProps< Item >} props - The component props.
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
			page: 1,
			perPage: perPageSizes[ 0 ] ?? 10,
			search: '',
			...viewRest,
			type: 'table',
			showLevels: true,
			titleField,
			fields: columnFields,
		} as View;
	} );

	const { data: orderedData, levelByItem } = useMemo(
		() => processHierarchyLevels( data, getItemId, getItemParentId ),
		[ data, getItemId, getItemParentId ]
	);

	const { data: pageData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( orderedData, view, fields ),
		[ orderedData, view, fields ]
	);

	const getItemLevel = useCallback(
		( item: Item ) => levelByItem.get( item ) ?? 0,
		[ levelByItem ]
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
