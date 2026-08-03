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
import { computeCalendarHeatmapLayout, fitCompactCalendarHeatmapColumns } from './layout';
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
const EXPANDED_ASPECT_RATIO = 61 / 40;
const EXPANDED_MAX_CELL_HEIGHT = 48;
// If the tile is at least this tall, use expanded cells ( not compact ).
const EXPANDED_MIN_HEIGHT = 220;

// Minimum span, in days.
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

	// Expanded is sized to the computed rectangle so its `minmax(0, 1fr)` tracks
	// fill it with 61:40 cells; compact renders the chart's own fixed squares and
	// sizes itself. The measured parent centers whichever one, so a grid smaller
	// than the tile sits in centered whitespace.
	const { columns, sizingProps } = useMemo( () => {
		if ( isExpanded ) {
			const layout = computeCalendarHeatmapLayout( {
				availWidth: size.width,
				availHeight: size.height,
				dataColumns,
				aspectRatio: EXPANDED_ASPECT_RATIO,
				maxCellHeight: EXPANDED_MAX_CELL_HEIGHT,
			} );
			return {
				columns: layout.columns,
				sizingProps: {
					width: layout.heatmapWidth,
					height: layout.heatmapHeight,
					showValues: layout.cellWidth > 30,
				},
			};
		}

		const fitColumns = fitCompactCalendarHeatmapColumns( {
			availWidth: size.width,
			dataColumns,
		} );
		return { columns: fitColumns, sizingProps: { compact: true } };
	}, [ isExpanded, size.width, size.height, dataColumns ] );

	// Keep the most-recent weeks: drop the oldest week columns from the left when
	// the tile can't fit them all. `slice( -0 )` returns the whole array, so a zero
	// column count (degenerate tile) leaves the data untouched.
	const trimmedData = useMemo( () => heatmapData.slice( -columns ), [ heatmapData, columns ] );

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
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
							onClick: () => void refetch(),
						},
					],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No posts published in this period.', 'jetpack-premium-analytics-pkg' ),
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
						lessLabel={ __( 'Fewer Posts', 'jetpack-premium-analytics-pkg' ) }
						moreLabel={ __( 'More Posts', 'jetpack-premium-analytics-pkg' ) }
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
