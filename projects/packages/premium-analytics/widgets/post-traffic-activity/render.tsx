/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	CALENDAR_HEATMAP_CELL_GAP,
	CALENDAR_HEATMAP_HEADER_HEIGHT,
	CalendarHeatmapPagerOverlay,
	CalendarHeatmapTooltip,
	HeatmapChartUnresponsive,
	HeatmapSkeleton,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	fitWeekColumns,
	formatViewCount,
	toDay,
	useElementSize,
	useWidgetRootContext,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostTrafficActivity from './use-post-traffic-activity';
import type { PostTrafficActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostTrafficActivityRenderAttributes = PostTrafficActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostTrafficActivityWidgetProps = WidgetRenderProps< PostTrafficActivityRenderAttributes >;

/**
 * One page shows as many whole week columns as fit at the design's cell width.
 * Gap and header height come from the shared layout helper, not restated here.
 */
const CELL_WIDTH = 64;
const MIN_PAGE_WEEKS = 4;
const DEFAULT_PAGE_WEEKS = 16;

/**
 * Whole week columns that fit the measured card width.
 */
function weeksForWidth( width?: number ): number {
	if ( ! width ) {
		return DEFAULT_PAGE_WEEKS;
	}

	return fitWeekColumns( {
		availWidth: width,
		cellWidth: CELL_WIDTH,
		cellGap: CALENDAR_HEATMAP_CELL_GAP,
		minColumns: MIN_PAGE_WEEKS,
	} );
}

const MAX_CELL_HEIGHT = 42;
const MIN_CELL_HEIGHT = 8;
// The grid's vertical overhead around the seven cell tracks: the auto header
// row holding the month labels, plus its gap and the six inter-row gaps.
const GRID_VERTICAL_OVERHEAD = CALENDAR_HEATMAP_HEADER_HEIGHT + 7 * CALENDAR_HEATMAP_CELL_GAP;

/**
 * Cell height that keeps the whole grid inside the measured chart area. A fixed
 * cap alone overflows short tiles, and centering then pushes the month labels
 * above the scroll origin where they clip.
 */
function cellHeightForArea( height: number ): number {
	if ( ! height ) {
		return MAX_CELL_HEIGHT;
	}

	return Math.max(
		MIN_CELL_HEIGHT,
		Math.min( MAX_CELL_HEIGHT, Math.floor( ( height - GRID_VERTICAL_OVERHEAD ) / 7 ) )
	);
}

/**
 * Renders one page of the post's daily views as a calendar heatmap. Without a
 * post scope the query never enables and the empty state shows.
 */
function PostTrafficActivityInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	// One page spans the whole week columns that fit the measured card width,
	// so the grid fills the card without horizontal scrolling.
	const [ width, setWidth ] = useState< number >();
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			// Round and dedupe so subpixel resize reports don't churn renders.
			const next = Math.round( rect.width );
			setWidth( previous => ( previous === next ? previous : next ) );
		}
	} );

	const {
		days,
		isPaged,
		canShowOlder,
		canShowNewer,
		showOlder,
		showNewer,
		isLoading,
		isFetching,
		isError,
		refetch,
	} = usePostTrafficActivity( postId, reportParams, weeksForWidth( width ) * 7 );

	// Only the cell height reads this; the page span stays width-derived, so
	// paging cannot feed back into the measurement and oscillate.
	const [ chartAreaRef, chartAreaSize ] = useElementSize< HTMLDivElement >();
	const maxCellHeight = cellHeightForArea( chartAreaSize.height );

	const { data: heatmapData, rowLabels } = useMemo(
		() => buildCalendarHeatmapData( days ),
		[ days ]
	);

	const from = toDay( reportParams.from );
	const to = toDay( reportParams.to );

	// Filler days before the range start are masked, not measured — "No views"
	// would be false there; the week-aligned start makes `column * 7 + row` the flat index.
	const renderCellTooltip = useCallback(
		( { value, cellLabel, row, column }: HeatmapTooltipData ) => {
			const day = days[ column * 7 + row ];
			const inRange = !! day && !! from && !! to && day.dateString >= from && day.dateString <= to;

			return (
				<CalendarHeatmapTooltip
					value={ value }
					cellLabel={ cellLabel }
					emptyLabel={
						inRange
							? __( 'No views', 'jetpack-premium-analytics-pkg' )
							: __( 'No data', 'jetpack-premium-analytics-pkg' )
					}
					formatValue={ formatViewCount }
				/>
			);
		},
		[ days, from, to ]
	);

	return (
		<div ref={ measureRef } className={ styles.root }>
			<div className={ styles.body }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ postId <= 0 || heatmapData.length === 0 }
					error={ {
						description: __(
							"We couldn't load this traffic activity. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					// A post with no traffic renders the all-blank grid (the sparse
					// treatment), so the empty state only covers the missing scope.
					empty={ {
						icon: reports,
						description: __(
							'Open a post or page report to see its traffic activity here.',
							'jetpack-premium-analytics-pkg'
						),
					} }
					renderLoading={ <HeatmapSkeleton /> }
				>
					<div className={ styles.content }>
						{ /* The unresponsive export: the grid is content-sized already, so
						     the responsive wrapper would only break the centered grid. */ }
						<div ref={ chartAreaRef } className={ styles.chartArea }>
							{ /* Arrows only exist when the range exceeds one page, and only in
							     the ready state where the grid they step is visible. */ }
							<CalendarHeatmapPagerOverlay
								pager={ isPaged ? { canShowOlder, canShowNewer, showOlder, showNewer } : undefined }
								className={ styles.chartHost }
							>
								<HeatmapChartUnresponsive
									data={ heatmapData }
									rowLabels={ rowLabels }
									primaryColor="var(--wp-admin-theme-color, #3858e9)"
									withTooltips
									// The page span is already sized to the card, so width tracks
									// never need to shrink below the design's 64px.
									maxCellWidth={ 64 }
									maxCellHeight={ maxCellHeight }
									renderTooltip={ renderCellTooltip }
									className={ styles.heatmap }
								/>
							</CalendarHeatmapPagerOverlay>
						</div>
					</div>
				</WidgetState>
			</div>
		</div>
	);
}

export default function PostTrafficActivity( { attributes = {} }: PostTrafficActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostTrafficActivityInner />
		</WidgetRoot>
	);
}
