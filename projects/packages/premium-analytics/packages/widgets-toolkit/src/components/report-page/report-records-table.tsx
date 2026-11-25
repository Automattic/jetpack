/**
 * External dependencies
 */
import {
	DataViews,
	filterSortAndPaginate,
	type Action,
	type Field,
	type SupportedLayouts,
	type View,
} from '@jetpack-premium-analytics/externals';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { ReportTableEmptyState } from './report-empty-state';
import { ReportPageSection } from './report-page-layout';
import styles from './report-records-table.module.scss';
import './report-records-table.scss';
import { useTableRevalidating } from './use-table-revalidating';
import type { ComponentProps, ReactElement } from 'react';

const NO_PER_PAGE_SIZES: number[] = [];

// Rows per infinite-scroll batch; DataViews keeps only the rows near the viewport mounted.
const REPORT_TABLE_BATCH_SIZE = 50;

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
	searchLabel?: string;
	config?: { perPageSizes: number[] };
	isItemClickable?: ( item: Item ) => boolean;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
} ) => ReturnType< typeof DataViews >;

export interface ReportRecordsTableProps< Item > {
	/** All records for the current report and range; paging/search/sort happen client-side. */
	data: Item[];
	/** The DataViews field config — one entry per column. */
	fields: Field< Item >[];
	/** Stable id per record (post ID, country code, search term, …). */
	getItemId: ( item: Item ) => string;
	/** Initial view overrides (default sort, visible fields, …). */
	initialView?: Partial< View >;
	/** Whether rows for the current params are still loading. */
	isLoading?: boolean;
	/** Whether the rows on screen are revalidating; ignored while there are none, so an empty report keeps its empty state. */
	isFetching?: boolean;
	/** Accessible label for the search input. */
	searchLabel?: string;
	/** Optional row actions. */
	actions?: Action< Item >[];
	/**
	 * Called after every view change, with the view the table just moved to.
	 *
	 * The table still owns its view state; this only reports it outwards, for
	 * a page whose data request depends on the view — a filter the API applies
	 * server-side, say. Remounting the table (a `key` per tab) resets the view
	 * but not the page's copy, which the page has to clear for itself, or the
	 * request stays scoped by a filter the table no longer shows.
	 */
	onChangeView?: ( view: View ) => void;
	/** Called with the rows the table has mounted, in display order. */
	onChangePageItems?: ( items: Item[] ) => void;
	/** Whether a record's primary field should render as an interactive link. */
	isItemClickable?: ( item: Item ) => boolean;
	/** Render the primary-field link while preserving DataViews table styling. */
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
}

/**
 * The report page's records table: a Core DataViews table (search, sortable +
 * configurable columns) listing every one of the module's normalized report rows,
 * as Calypso's "View all" pages do. Filtering and sorting run client-side via
 * `filterSortAndPaginate` — report modules return the full summarized list for
 * the selected range, so no server round-trip is needed.
 *
 * The module page supplies the data and field config; this owns the view
 * state, so every report table behaves the same. With no rows it renders the
 * report's loading or empty state in its place.
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
	isFetching = false,
	searchLabel,
	actions,
	onChangeView,
	onChangePageItems,
	isItemClickable,
	renderItemLink,
}: ReportRecordsTableProps< Item > ) {
	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				search: '',
				// DataViews renders only the columns listed in `view.fields` —
				// there is no "all fields" default — so seed it with every
				// configured field. `initialView` can still narrow it. A primary
				// field (title, media, description) has its own column, so listing
				// it here would draw it twice.
				fields: fields
					.map( field => field.id )
					.filter(
						id =>
							! [
								initialView?.titleField,
								initialView?.mediaField,
								initialView?.descriptionField,
							].includes( id )
					),
				...initialView,
				perPage: REPORT_TABLE_BATCH_SIZE,
				infiniteScrollEnabled: true,
			} ) as View
	);
	// Kept out of `view` so scrolling does not re-sort the rows.
	const [ startPosition, setStartPosition ] = useState( 1 );
	// The table layout never unloads rows, so everything up to the furthest batch stays mounted.
	const [ furthestStart, setFurthestStart ] = useState( 1 );
	// DataViews places accumulated rows by position and resets them only on a new search, filter or
	// page size, so a new sort or data set remounts it instead.
	const [ generation, setGeneration ] = useState( 0 );
	const [ generationData, setGenerationData ] = useState( data );
	if ( data !== generationData ) {
		setGenerationData( data );
		setGeneration( current => current + 1 );
		setStartPosition( 1 );
		setFurthestStart( 1 );
	}
	const rootRef = useRef< HTMLDivElement >( null );
	const restoreFocusRef = useRef( false );

	const handleChangeView = useCallback(
		( nextView: View ) => {
			const { startPosition: nextStartPosition = 1, ...nextRest } = nextView;
			const isScrollOnly =
				Object.keys( nextRest ).length === Object.keys( view ).length &&
				Object.entries( nextRest ).every(
					( [ key, value ] ) => view[ key as keyof View ] === value
				);

			if ( isScrollOnly ) {
				setStartPosition( nextStartPosition );
				setFurthestStart( current => Math.max( current, nextStartPosition ) );
				return;
			}

			if ( nextRest.sort !== view.sort ) {
				setGeneration( current => current + 1 );
				restoreFocusRef.current = true;
			}
			setView( nextRest as View );
			setStartPosition( 1 );
			setFurthestStart( 1 );
			onChangeView?.( nextView );
		},
		[ onChangeView, view ]
	);

	// The remount drops the sort menu's trigger, so park focus on the table rather than `<body>`.
	useLayoutEffect( () => {
		if ( restoreFocusRef.current ) {
			restoreFocusRef.current = false;
			rootRef.current?.focus();
		}
	}, [ generation ] );

	const { data: orderedItems, paginationInfo } = useMemo(
		() =>
			filterSortAndPaginate(
				data,
				{ ...view, page: undefined, perPage: undefined, infiniteScrollEnabled: false },
				fields
			),
		[ data, view, fields ]
	);
	const batchStart = startPosition - 1;
	const batchItems = useMemo(
		() => orderedItems.slice( batchStart, batchStart + REPORT_TABLE_BATCH_SIZE ),
		[ orderedItems, batchStart ]
	);
	const mountedItems = useMemo(
		() => orderedItems.slice( 0, furthestStart - 1 + REPORT_TABLE_BATCH_SIZE ),
		[ orderedItems, furthestStart ]
	);
	const dataViewsView = useMemo( () => ( { ...view, startPosition } ), [ view, startPosition ] );

	useEffect( () => {
		onChangePageItems?.( mountedItems );
	}, [ onChangePageItems, mountedItems ] );

	const isRevalidating = useTableRevalidating( isFetching );

	// A filter the API applies server-side can scope the rows to none, and the table carries the control that clears it.
	if ( data.length === 0 && ! view.filters?.length ) {
		return <ReportTableEmptyState isLoading={ isLoading } />;
	}

	return (
		<ReportPageSection className={ styles.root }>
			<div ref={ rootRef } tabIndex={ -1 } className={ styles.focusTarget }>
				<GenericDataViews< Item >
					key={ generation }
					view={ dataViewsView }
					onChangeView={ handleChangeView }
					fields={ fields }
					data={ batchItems }
					getItemId={ getItemId }
					isLoading={ isLoading || isRevalidating }
					paginationInfo={ paginationInfo }
					defaultLayouts={ { table: {} } }
					actions={ actions }
					searchLabel={ searchLabel }
					config={ { perPageSizes: NO_PER_PAGE_SIZES } }
					isItemClickable={ isItemClickable }
					renderItemLink={ renderItemLink }
				/>
			</div>
		</ReportPageSection>
	);
}
