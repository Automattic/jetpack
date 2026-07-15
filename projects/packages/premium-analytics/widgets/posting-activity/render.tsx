/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	HeatmapChartUnresponsive,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	useElementSize,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { computeCalendarHeatmapLayout, fitCalendarHeatmapColumns } from './layout';
import { resolveStreakRange } from './streak-range';
import { buildStreakSeries } from './streak-series';
import styles from './style.module.css';
import type { PostingActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

// --- Heatmap sizing tuning ---------------------------------------------------
// All layout policy lives here so the look can be tuned without touching the
// pure geometry in `layout.ts`.

/** Weekday rows in the calendar grid (the column-label header row is separate). */
const ROWS = 7;
/** Minimum week columns to keep before the cell is scaled down. */
const MIN_COLUMNS = 4;

/** Expanded cell width / height ratio. Always preserved — cells never stretch. */
const EXPANDED_ASPECT_RATIO = 61 / 40;

/** Per-mode cap on cell height, in px (height drives the expanded cell size). */
const EXPANDED_MAX_CELL_HEIGHT = 48;

/**
 * Compact mode renders the chart's own fixed-size squares (it does not scale), so
 * these mirror the chart theme's `heatmapChart.compactCellSize` / `compactCellGap`
 * and are used only to trim the data to the columns that fit the width.
 */
const COMPACT_CELL_SIZE = 11;
const COMPACT_CELL_GAP = 2;

/**
 * Gap between expanded cells, in px. Matches the chart grid's own non-compact gap
 * (`--wpds-dimension-gap-xs`), so the computed rectangle agrees with what the
 * chart renders without overriding the chart's gap variable.
 */
const GAP = 4;

// Overhead reserved around the grid, in px. These budget the chart's own chrome
// so the computed rectangle leaves room for it: the column-label header row, and
// the legend plus the gap the chart lays out between the grid and the legend.
const ROW_LABEL_WIDTH = 32;
const HEADER_HEIGHT = 16;
const LEGEND_HEIGHT = 44;

/**
 * Available height (px) at or above which the heatmap switches to expanded 61:40
 * cells. Roughly where compact cells would already hit their cap and there is
 * vertical room to spare; below it the tile stays compact.
 */
const EXPANDED_MIN_HEIGHT = 220;

/**
 * Minimum span, in days, the streak fetch always covers (ending on the report's
 * end date) so the heatmap has a full year of week columns to lay out even when
 * the dashboard date picker is on a short range.
 */
const MIN_STREAK_DAYS = 365;

/**
 * Fetches the posting-activity streak through the designated `useStatsStreak`
 * hook and renders it as a calendar heatmap. The `stats/streak` endpoint
 * returns a `{ 'yyyy-MM-dd': count }` map of posts per day (no comparison
 * period); `buildCalendarHeatmapData` lays that out into the week-column /
 * weekday-row grid the chart expects.
 *
 * The date range comes from the dashboard picker via `reportParams`, but the
 * fetch window is floored to at least a year (`MIN_STREAK_DAYS`) ending on the
 * picker's end date — a calendar heatmap needs a span of weeks, not a 7-day slice.
 *
 * The heatmap adapts to the tile: it measures the available space and picks
 * compact (fixed-size squares) or expanded (scaled 61:40 cells with numbers) from
 * the available height, trimming the data to the columns that fit the width.
 *
 * @return The widget content.
 */
function PostingActivityInner() {
	const { reportParams } = useWidgetRootContext();

	// Floor the fetch window to a full year ending on the picker's end date.
	const streakRange = useMemo(
		() => resolveStreakRange( reportParams, MIN_STREAK_DAYS, format( new Date(), 'yyyy-MM-dd' ) ),
		[ reportParams ]
	);
	const streakParams = useMemo(
		() => ( { ...reportParams, startDate: streakRange.startDate, endDate: streakRange.endDate } ),
		[ reportParams, streakRange ]
	);

	const { data, isLoading, isFetching, isError, refetch } = useStatsStreak( streakParams );

	const { data: heatmapData, rowLabels } = useMemo( () => {
		// The endpoint returns only days with posts; densify to the full window so
		// the heatmap spans every week column, not just the weeks that have posts.
		const series = buildStreakSeries( data ?? {}, streakRange.startDate, streakRange.endDate );
		return buildCalendarHeatmapData( series );
	}, [ data, streakRange ] );

	const hasData = heatmapData.length > 0;
	const dataColumns = heatmapData.length;

	// Measure the tile; the parent div fills the widget slot (with no padding of its
	// own), so its size is the space the heatmap has to work with.
	const [ setRef, size ] = useElementSize< HTMLDivElement >();

	// Height drives the mode. Expanded: a scaled 61:40 grid sized to the computed
	// rectangle (numbers shown). Compact: the chart's own fixed-size squares — we
	// don't size it, only compute how many columns fit so the data is trimmed to
	// avoid a scroll.
	const isExpanded = size.height >= EXPANDED_MIN_HEIGHT;

	const { columns, expandedLayout } = useMemo( () => {
		if ( isExpanded ) {
			const computed = computeCalendarHeatmapLayout( {
				availWidth: size.width,
				availHeight: size.height,
				dataColumns,
				rows: ROWS,
				aspectRatio: EXPANDED_ASPECT_RATIO,
				maxCellHeight: EXPANDED_MAX_CELL_HEIGHT,
				minColumns: MIN_COLUMNS,
				gap: GAP,
				headerHeight: HEADER_HEIGHT,
				legendHeight: LEGEND_HEIGHT,
				rowLabelWidth: ROW_LABEL_WIDTH,
			} );
			return { columns: computed.columns, expandedLayout: computed };
		}

		const fitColumns = fitCalendarHeatmapColumns( {
			availWidth: size.width,
			cellWidth: COMPACT_CELL_SIZE,
			gap: COMPACT_CELL_GAP,
			rowLabelWidth: ROW_LABEL_WIDTH,
			dataColumns,
			minColumns: MIN_COLUMNS,
		} );
		return { columns: fitColumns, expandedLayout: null };
	}, [ isExpanded, size.width, size.height, dataColumns ] );

	// Keep the most-recent weeks: drop the oldest week columns from the left when
	// the tile can't fit them all.
	const trimmedData = useMemo(
		() => ( columns > 0 ? heatmapData.slice( -columns ) : heatmapData ),
		[ heatmapData, columns ]
	);

	// Expanded is sized to the computed rectangle so its `minmax(0, 1fr)` tracks
	// fill it with 61:40 cells; compact renders the chart's own fixed squares and
	// sizes itself. The measured parent centers whichever one, so a grid smaller
	// than the tile sits in centered whitespace.
	const sizingProps = isExpanded
		? {
				width: expandedLayout?.heatmapWidth,
				height: expandedLayout?.heatmapHeight,
				showValues: true,
		  }
		: { compact: true };

	return (
		<div className={ styles.content } ref={ setRef }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps the previous response via `placeholderData`, so only
				// surface the error when there is nothing to show.
				isError={ isError && ! hasData }
				isEmpty={ ! hasData }
				error={ {
					description: __(
						"We couldn't load posting activity. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: () => void refetch() },
					],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No posts published in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<HeatmapChartUnresponsive
					data={ trimmedData }
					rowLabels={ rowLabels }
					className={ styles.heatmap }
					primaryColor="var(--wp-admin-theme-color, #3858e9)"
					withTooltips
					{ ...sizingProps }
				>
					<HeatmapChartUnresponsive.Legend
						lessLabel={ __( 'Fewer Posts', 'jetpack-premium-analytics' ) }
						moreLabel={ __( 'More Posts', 'jetpack-premium-analytics' ) }
					/>
				</HeatmapChartUnresponsive>
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner heatmap — resolved from the dashboard date range
 * via context, the same way the other Stats widgets read them. This widget has
 * no own settings, so nothing is forwarded to the inner component.
 *
 * @param {PostingActivityWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<PostingActivityInner />
			</div>
		</WidgetRoot>
	);
}
