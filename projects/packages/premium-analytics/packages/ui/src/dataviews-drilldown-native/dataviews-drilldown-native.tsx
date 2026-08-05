/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './dataviews-drilldown-native.module.scss';
import { processHierarchyLevels, withHierarchyContext } from './process-hierarchy-levels';
import type {
	Field,
	SupportedLayouts,
	View,
	ViewBaseProps,
} from '@jetpack-premium-analytics/externals';
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
 * Render flat parent/child rows through DataViews' native hierarchy support
 * (`view.showLevels` + `getItemLevel`), keeping the hierarchy legible across
 * interactions: search and filter keep each match under its ancestors, sort
 * orders within each level (not a flat global sort), and rows are emitted in
 * depth-first order before pagination. There is no expand/collapse yet; the
 * native level rendering is a static display.
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

	// Keep the hierarchy legible instead of the flat `filterSortAndPaginate`
	// semantics: match, re-attach ancestors, re-emit in hierarchy order, then
	// paginate. Runs over the in-memory rows, so the extra passes are cheap.
	const { pageData, levelById, paginationInfo } = useMemo( () => {
		// 1. Match: apply the view's search + filters only (no sort, one page).
		const matches = filterSortAndPaginate(
			data,
			{ ...view, sort: undefined, page: 1, perPage: Math.max( data.length, 1 ) },
			fields
		).data;

		// 2. Re-attach each match's ancestors (so filtered children stay under
		//    their parents instead of orphaned) and descendants (so a matched
		//    parent keeps the group its aggregate describes).
		const subset = withHierarchyContext(
			data,
			new Set( matches.map( getItemId ) ),
			getItemId,
			getItemParentId
		);

		// 3. Sort within levels: sort the subset flat, then re-emit in hierarchy
		//    order; `processHierarchyLevels` keeps that order among siblings.
		const sorted = filterSortAndPaginate(
			subset,
			{ ...view, search: '', filters: [], page: 1, perPage: Math.max( subset.length, 1 ) },
			fields
		).data;
		const { data: orderedData, levelById: levels } = processHierarchyLevels(
			sorted,
			getItemId,
			getItemParentId
		);

		// 4. Paginate the hierarchy-ordered rows ourselves.
		const perPage = view.perPage ?? 10;
		const page = view.page ?? 1;
		const start = ( page - 1 ) * perPage;

		return {
			pageData: orderedData.slice( start, start + perPage ),
			levelById: levels,
			paginationInfo: {
				totalItems: orderedData.length,
				totalPages: Math.max( 1, Math.ceil( orderedData.length / perPage ) ),
			},
		};
	}, [ data, view, fields, getItemId, getItemParentId ] );

	// Resolved by id: DataViews clones each record internally, so the items
	// reaching `getItemLevel` are never the objects the hierarchy walk saw.
	const getItemLevel = useCallback(
		( item: Item ) => levelById.get( getItemId( item ) ) ?? 0,
		[ levelById, getItemId ]
	);

	// DataViews' appearance panel force-sets `showLevels: false` when you sort
	// (native levels assume the default order). Our pipeline sorts within each
	// level, so re-assert `showLevels: true` on every view change.
	// TODO(upstream): DataViews shouldn't drop levels when the consumer's sort
	// preserves the hierarchy; worth upstreaming so this workaround can go.
	const handleChangeView = useCallback(
		( nextView: View ) => setView( { ...nextView, showLevels: true } ),
		[]
	);

	return (
		<div className={ clsx( styles.root, hideLevelMarkers && styles.hideLevelMarkers ) }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ handleChangeView }
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
