/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { collectAncestorIds, filterCollapsedRows, findParentIds } from './collapsible-rows';
import styles from './dataviews-drilldown-native.module.scss';
import { DrilldownToggle } from './drilldown-toggle';
import { processHierarchyLevels, withHierarchyContext } from './process-hierarchy-levels';
import type {
	DataViewRenderFieldProps,
	Field,
	SupportedLayouts,
	View,
	ViewBaseProps,
} from '@jetpack-premium-analytics/externals';
import type { ComponentProps, ReactNode } from 'react';

type PaginationInfo = ComponentProps< typeof DataViews >[ 'paginationInfo' ];
type OnChangeViewBaseProps< Item > = ViewBaseProps< Item >[ 'onChangeView' ];
type GetItemIdBaseProps< Item > = ViewBaseProps< Item >[ 'getItemId' ];
type GetItemLevelBaseProps< Item > = ViewBaseProps< Item >[ 'getItemLevel' ];

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];
const NO_IDS: ReadonlySet< string > = new Set();

type CollapseContextValue = {
	isExpanded: ( id: string ) => boolean;
	toggleableIds: ReadonlySet< string >;
	onToggle: ( id: string ) => void;
	/**
	 * The consumer's own title field and id resolver, which the grafted cell
	 * renders through. They travel by context rather than by closure so the
	 * grafted `render` can stay one module-level component: a per-render
	 * component identity would remount the cell and drop focus from the
	 * toggle whenever the consumer's `fields` array is a fresh reference.
	 * `Item` is erased here because one context serves every instantiation.
	 */
	titleField?: Field< unknown >;
	getItemId: ( item: unknown ) => string;
};

const CollapseContext = createContext< CollapseContextValue | null >( null );

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

/**
 * The title field's cell with the fold control prepended.
 *
 * Module-level on purpose: this is the `render` the component grafts onto the
 * consumer's title field, and a `render` rebuilt per render would remount the
 * cell — taking the focused toggle with it.
 */
function CollapsibleTitleCell< Item >( props: DataViewRenderFieldProps< Item > ) {
	const collapse = useContext( CollapseContext );

	if ( ! collapse ) {
		throw new Error( 'CollapsibleTitleCell must be rendered within CollapseContext.' );
	}

	const { titleField, getItemId } = collapse as unknown as {
		titleField?: Field< Item >;
		getItemId: GetItemIdBaseProps< Item >;
	};
	const id = getItemId( props.item );
	// `props.field` is DataViews' normalized field, so its `getValue` covers
	// the dotted-path default a field without one gets upstream.
	const label = props.field.getValue( { item: props.item } );
	const RenderTitle = titleField?.render;

	return (
		<span className={ styles.titleCell }>
			<DrilldownToggle
				label={ label ? String( label ) : __( 'Toggle group', 'jetpack-premium-analytics-pkg' ) }
				expanded={ collapse.isExpanded( id ) }
				onToggle={ collapse.toggleableIds.has( id ) ? () => collapse.onToggle( id ) : undefined }
			/>
			{ RenderTitle ? <RenderTitle { ...props } /> : String( label ?? '' ) }
		</span>
	);
}

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
	/** Add a fold control to rows that have children. */
	collapsible?: boolean;
	/** Whether rows start unfolded. Ignored unless `collapsible`. */
	defaultExpanded?: 'all' | 'none';
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
 * depth-first order before pagination. Pass `collapsible` to fold branches.
 */
export function DataViewsDrilldownNative< Item >( {
	data,
	fields,
	getItemId,
	getItemParentId,
	initialView,
	hideLevelMarkers = false,
	collapsible = false,
	defaultExpanded = 'all',
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

	// The rows the reader has toggled away from `defaultExpanded`, rather than
	// the expanded ids themselves: rows that arrive later (an async load, a
	// filter change) then follow the default instead of coming back folded.
	const [ toggledIds, setToggledIds ] = useState< ReadonlySet< string > >( () => new Set() );
	const expandedByDefault = defaultExpanded !== 'none';

	// Keep the hierarchy legible instead of the flat `filterSortAndPaginate`
	// semantics: match, re-attach ancestors, re-emit in hierarchy order, then
	// paginate. Runs over the in-memory rows, so the extra passes are cheap.
	const { pageData, levelById, paginationInfo, toggleableIds, isExpanded } = useMemo( () => {
		// 1. Match: apply the view's search + filters only (no sort, one page).
		const matches = filterSortAndPaginate(
			data,
			{ ...view, sort: undefined, page: 1, perPage: Math.max( data.length, 1 ) },
			fields
		).data;
		const matchedIds = new Set( matches.map( getItemId ) );

		// 2. Re-attach each match's ancestors (so filtered children stay under
		//    their parents instead of orphaned) and descendants (so a matched
		//    parent keeps the group its aggregate describes).
		const subset = withHierarchyContext( data, matchedIds, getItemId, getItemParentId );

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

		// 4. Fold the collapsed branches away. A narrowed table must still answer
		//    the search that narrowed it, so the matches' ancestors unfold for as
		//    long as the search or filter is on.
		const isNarrowed = matches.length !== data.length;
		const forcedIds =
			collapsible && isNarrowed
				? collectAncestorIds( orderedData, matchedIds, getItemId, getItemParentId )
				: NO_IDS;
		const isExpandedForRow = ( id: string ) =>
			expandedByDefault !== toggledIds.has( id ) || forcedIds.has( id );
		const visibleData = collapsible
			? filterCollapsedRows( orderedData, getItemId, levels, isExpandedForRow )
			: orderedData;
		// Resolve parents before folding so collapsed rows keep their controls.
		// Forced-open ancestors stay non-interactive to preserve stored state.
		const parentIds = collapsible
			? findParentIds( orderedData, getItemId, getItemParentId )
			: NO_IDS;
		const toggleableRowIds = forcedIds.size
			? new Set( [ ...parentIds ].filter( id => ! forcedIds.has( id ) ) )
			: parentIds;

		// 5. Paginate the rows that survived, so folded children stop consuming
		//    pages. Folding cannot strand the reader past the last page: the rows
		//    a fold removes all follow the folded row, which is on the page they
		//    folded it from.
		const perPage = view.perPage ?? 10;
		const page = view.page ?? 1;
		const start = ( page - 1 ) * perPage;

		return {
			pageData: visibleData.slice( start, start + perPage ),
			levelById: levels,
			paginationInfo: {
				totalItems: visibleData.length,
				totalPages: Math.max( 1, Math.ceil( visibleData.length / perPage ) ),
			},
			toggleableIds: toggleableRowIds,
			isExpanded: isExpandedForRow,
		};
	}, [
		data,
		view,
		fields,
		getItemId,
		getItemParentId,
		collapsible,
		expandedByDefault,
		toggledIds,
	] );

	const handleToggle = useCallback( ( id: string ) => {
		setToggledIds( current => {
			const next = new Set( current );

			if ( ! next.delete( id ) ) {
				next.add( id );
			}

			return next;
		} );
	}, [] );
	const titleField = useMemo(
		() => fields.find( field => field.id === view.titleField ),
		[ fields, view.titleField ]
	);
	const collapseContextValue = useMemo(
		() =>
			( {
				isExpanded,
				toggleableIds,
				onToggle: handleToggle,
				titleField,
				getItemId,
			} ) as unknown as CollapseContextValue,
		[ isExpanded, toggleableIds, handleToggle, titleField, getItemId ]
	);

	// The fold control belongs to the title cell — the only column DataViews
	// renders levels on — so it is grafted onto the consumer's title field
	// rather than asked for in every field config.
	const displayFields = useMemo( () => {
		if ( ! collapsible ) {
			return fields;
		}

		return fields.map( field =>
			field.id === view.titleField ? { ...field, render: CollapsibleTitleCell } : field
		);
	}, [ collapsible, fields, view.titleField ] );

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
		<CollapseContext.Provider value={ collapseContextValue }>
			<div className={ clsx( styles.root, hideLevelMarkers && styles.hideLevelMarkers ) }>
				<GenericDataViews< Item >
					view={ view }
					onChangeView={ handleChangeView }
					fields={ displayFields }
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
		</CollapseContext.Provider>
	);
}
