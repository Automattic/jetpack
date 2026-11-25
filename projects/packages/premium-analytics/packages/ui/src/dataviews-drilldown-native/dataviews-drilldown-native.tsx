/**
 * External dependencies
 */
import { DataViews, filterSortAndPaginate } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
/**
 * Internal dependencies
 */
import { collectAncestorIds, filterCollapsedRows, findParentIds } from './collapsible-rows';
import styles from './dataviews-drilldown-native.module.scss';
import { DrilldownToggle } from './drilldown-toggle';
import { processHierarchyLevels, withHierarchyContext } from './process-hierarchy-levels';
import type {
	Action,
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

const NO_PER_PAGE_SIZES: number[] = [];

// Folding shifts every later row's position, which DataViews' infinite scroll cannot follow,
// so this table mounts a growing prefix of its rows instead of a scroll window.
const ROW_BATCH_SIZE = 50;
const GROW_THRESHOLD_PX = 600;
const NO_IDS: ReadonlySet< string > = new Set();

type CollapseContextValue = {
	isExpanded: ( id: string ) => boolean;
	/** Rows with children, which therefore get a fold control. */
	parentIds: ReadonlySet< string >;
	/** Rows a search or filter holds open: the control stays, inert. */
	forcedIds: ReadonlySet< string >;
	onToggle: ( id: string ) => void;
	/**
	 * Travels by context, not closure, so the grafted `render` stays one
	 * module-level component — a per-render identity would remount the cell
	 * and drop toggle focus. `Item` is erased since one context serves all.
	 */
	titleField?: Field< unknown >;
	getItemId: ( item: unknown ) => string;
};

const CollapseContext = createContext< CollapseContextValue | null >( null );

/**
 * `DataViews`' `getItemId` prop is conditionally optional based on `Item`
 * having `id: string`, which TS can't discharge for an unresolved generic.
 * This table always requires it, so erase the conditional via an alias.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: OnChangeViewBaseProps< Item >;
	fields: Field< Item >[];
	data: Item[];
	getItemId: GetItemIdBaseProps< Item >;
	getItemLevel?: GetItemLevelBaseProps< Item >;
	actions?: Action< Item >[];
	isLoading?: boolean;
	paginationInfo: PaginationInfo;
	defaultLayouts?: SupportedLayouts;
	empty?: ReactNode;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

/**
 * The title field's cell with the fold control appended. Module-level on
 * purpose: a `render` rebuilt per render would remount the cell and take the
 * focused toggle with it.
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
	const title = RenderTitle ? <RenderTitle { ...props } /> : String( label ?? '' );

	// A trailing control needs no placeholder on a childless row.
	if ( ! collapse.parentIds.has( id ) ) {
		return <>{ title }</>;
	}

	return (
		<span className={ styles.titleCell }>
			<span className={ styles.titleContent }>{ title }</span>
			<DrilldownToggle
				label={ label ? String( label ) : __( 'Toggle group', 'jetpack-premium-analytics-pkg' ) }
				expanded={ collapse.isExpanded( id ) }
				disabled={ collapse.forcedIds.has( id ) }
				onToggle={ () => collapse.onToggle( id ) }
			/>
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
	/** Initial view overrides (default sort, visible fields, ...). */
	initialView?: Partial< View >;
	/** Row actions; each one's `isEligible` decides which rows offer it. */
	actions?: Action< Item >[];
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
}

/**
 * Render flat parent/child rows through DataViews' native hierarchy support,
 * keeping search/filter/sort legible across the hierarchy (matches keep their
 * ancestors, sort is per-level, rows emit depth-first). `collapsible` folds branches.
 */
export function DataViewsDrilldownNative< Item >( {
	data,
	fields,
	getItemId,
	getItemParentId,
	initialView,
	actions,
	hideLevelMarkers = false,
	collapsible = false,
	defaultExpanded = 'all',
	isLoading = false,
	searchLabel,
	empty,
}: DataViewsDrilldownNativeProps< Item > ) {
	const [ view, setView ] = useState< View >( () => {
		const { fields: viewFieldIds, ...viewRest } = initialView ?? {};
		const [ titleField, ...columnFields ] = viewFieldIds ?? fields.map( field => field.id );

		return {
			page: 1,
			search: '',
			...viewRest,
			type: 'table',
			showLevels: true,
			titleField,
			fields: columnFields,
		} as View;
	} );

	const [ rowLimit, setRowLimit ] = useState( ROW_BATCH_SIZE );
	const [ rowLimitScope, setRowLimitScope ] = useState( { data, view } );
	const shouldResetRowLimit = rowLimitScope.data !== data || rowLimitScope.view !== view;
	if ( shouldResetRowLimit ) {
		setRowLimitScope( { data, view } );
		setRowLimit( ROW_BATCH_SIZE );
	}
	const rootRef = useRef< HTMLDivElement >( null );
	const rowCountRef = useRef( 0 );

	// Rows toggled away from `defaultExpanded`, not the expanded ids: rows
	// arriving later (async load, filter change) follow the default instead.
	const [ toggledIds, setToggledIds ] = useState< ReadonlySet< string > >( () => new Set() );
	const expandedByDefault = defaultExpanded !== 'none';

	// Keeps the hierarchy legible instead of `filterSortAndPaginate`'s flat
	// semantics — cheap since it runs over the in-memory rows.
	const { rows, levelById, paginationInfo, parentIds, forcedIds, isExpanded } = useMemo( () => {
		// 1. Match: apply the view's search + filters only (no sort, one page).
		const matches = filterSortAndPaginate(
			data,
			{ ...view, sort: undefined, page: 1, perPage: Math.max( data.length, 1 ) },
			fields
		).data;
		const matchedIds = new Set( matches.map( getItemId ) );

		// 2. Re-attach ancestors (so filtered children stay under their parents)
		//    and descendants (so a matched parent keeps its aggregate group).
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

		// 4. Fold collapsed branches away. A narrowed table must still answer the
		//    search that narrowed it, so matched ancestors stay unfolded meanwhile.
		const isNarrowed = matches.length !== data.length;
		const forcedRowIds =
			collapsible && isNarrowed
				? collectAncestorIds( orderedData, matchedIds, getItemId, getItemParentId )
				: NO_IDS;
		const isExpandedForRow = ( id: string ) =>
			expandedByDefault !== toggledIds.has( id ) || forcedRowIds.has( id );
		const visibleData = collapsible
			? filterCollapsedRows( orderedData, getItemId, levels, isExpandedForRow )
			: orderedData;
		// Resolve parents before folding so collapsed rows keep their controls.
		const parentRowIds = collapsible
			? findParentIds( orderedData, getItemId, getItemParentId )
			: NO_IDS;

		return {
			rows: visibleData,
			levelById: levels,
			paginationInfo: { totalItems: visibleData.length, totalPages: 1 },
			parentIds: parentRowIds,
			// A forced-open row keeps its control but must not write a fold that
			// takes effect invisibly — it would only surface once the search clears.
			forcedIds: forcedRowIds,
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

	rowCountRef.current = rows.length;
	const mountedRows = useMemo( () => rows.slice( 0, rowLimit ), [ rows, rowLimit ] );

	useEffect( () => {
		const root = rootRef.current;
		if ( ! root ) {
			return;
		}
		// Scroll does not bubble, so listen in the capture phase for the DataViews container's own.
		const handleScroll = ( event: Event ) => {
			const container = event.target as HTMLElement;
			if (
				container.classList?.contains( 'dataviews-layout__container' ) &&
				container.scrollTop + container.clientHeight >= container.scrollHeight - GROW_THRESHOLD_PX
			) {
				setRowLimit( limit => Math.min( limit + ROW_BATCH_SIZE, rowCountRef.current ) );
			}
		};
		root.addEventListener( 'scroll', handleScroll, true );
		return () => root.removeEventListener( 'scroll', handleScroll, true );
	}, [] );

	// A new data set or view starts over from the first row, scrolled back to the top.
	useLayoutEffect( () => {
		const container = rootRef.current?.querySelector( '.dataviews-layout__container' );
		if ( container ) {
			container.scrollTop = 0;
		}
	}, [ rowLimitScope ] );

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
				parentIds,
				forcedIds,
				onToggle: handleToggle,
				titleField,
				getItemId,
			} ) as unknown as CollapseContextValue,
		[ isExpanded, parentIds, forcedIds, handleToggle, titleField, getItemId ]
	);

	// The fold control belongs to the title cell — the only column DataViews
	// renders levels on — so it's grafted on rather than asked for per field.
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

	// DataViews clears `showLevels` on sort (assumes default order); we sort
	// within each level, so re-assert it here.
	// TODO(upstream): stop dropping levels when the sort preserves hierarchy.
	const handleChangeView = useCallback(
		( nextView: View ) => setView( { ...nextView, showLevels: true } ),
		[]
	);

	return (
		<CollapseContext.Provider value={ collapseContextValue }>
			<div
				ref={ rootRef }
				className={ clsx( styles.root, hideLevelMarkers && styles.hideLevelMarkers ) }
			>
				<GenericDataViews< Item >
					view={ view }
					onChangeView={ handleChangeView }
					fields={ displayFields }
					data={ mountedRows }
					getItemId={ getItemId }
					getItemLevel={ getItemLevel }
					actions={ actions }
					isLoading={ isLoading }
					paginationInfo={ paginationInfo }
					defaultLayouts={ { table: {} } }
					empty={ empty }
					searchLabel={ searchLabel }
					config={ { perPageSizes: NO_PER_PAGE_SIZES } }
				/>
			</div>
		</CollapseContext.Provider>
	);
}
