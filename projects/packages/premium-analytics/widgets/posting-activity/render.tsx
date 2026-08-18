/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	AdaptiveCalendarHeatmap,
	CalendarHeatmapPagerOverlay,
	CalendarHeatmapTooltip,
	HeatmapChartUnresponsive,
	WidgetRoot,
	WidgetState,
	describeError,
	resolveCalendarHeatmapWindow,
	resolveCalendarHeatmapWindowDays,
	useViewportWidth,
	useWidgetRootContext,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n, sprintf } from '@wordpress/i18n';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { PostingActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

// Shared so a pending or failed fetch doesn't hand the heatmap a fresh object
// every render, which would rebuild the whole dense day series each time.
const NO_POSTS_BY_DAY: Record< string, number | null > = {};

const formatPostCount = ( count: number ) =>
	sprintf(
		/* translators: %d: number of posts published that day, e.g. "3". */
		_n( '%d post', '%d posts', count, 'jetpack-premium-analytics-pkg' ),
		count
	);

function renderCellTooltip( { value, cellLabel }: HeatmapTooltipData ) {
	return (
		<CalendarHeatmapTooltip
			value={ value }
			cellLabel={ cellLabel }
			emptyLabel={ __( 'No posts', 'jetpack-premium-analytics-pkg' ) }
			formatValue={ formatPostCount }
		/>
	);
}

/**
 * The `stats/streak` endpoint returns a `{ 'yyyy-MM-dd': count }` map of posts
 * per day, with no comparison period.
 *
 * The date range comes from the dashboard picker via `reportParams`, but the fetch
 * window spans as much history as the widest possible tile could draw — a calendar
 * heatmap needs a span of weeks, not a 7-day slice, and the grid fills the tile
 * rather than stopping where the period does.
 *
 * `AdaptiveCalendarHeatmap` fits the grid to the tile: the height picks the cell
 * size, the width picks how many week columns are drawn.
 */
function PostingActivityInner() {
	const { reportParams } = useWidgetRootContext();

	// Same window rule as the other calendar heatmap: floor and cap the picker's
	// range at the history the viewport could show, so the two widgets fill their
	// tiles with the same span instead of one running out of data early.
	const viewportWidth = useViewportWidth();
	const windowDays = resolveCalendarHeatmapWindowDays( viewportWidth );
	const streakRange = useMemo(
		() =>
			resolveCalendarHeatmapWindow(
				reportParams,
				{ minDays: windowDays, maxDays: windowDays },
				format( new Date(), 'yyyy-MM-dd' )
			),
		[ reportParams, windowDays ]
	);
	const streakParams = useMemo(
		() => ( { ...reportParams, startDate: streakRange.startDate, endDate: streakRange.endDate } ),
		[ reportParams, streakRange ]
	);

	const { data, isLoading, isFetching, isError, error, refetch } = useStatsStreak( streakParams );

	// The endpoint returns only days with posts, so an empty response means the
	// window has none — the component densifies the rest into empty cells.
	const postsByDay = data ?? NO_POSTS_BY_DAY;
	const hasData = Object.keys( postsByDay ).length > 0;

	return (
		<AdaptiveCalendarHeatmap valueByDay={ postsByDay } period={ streakRange }>
			{ ( chartProps, pager ) => (
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// The query keeps the previous response via `placeholderData`, so only
					// surface the error when there is nothing to show.
					isError={ isError && ! hasData }
					isEmpty={ ! hasData }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load posting activity. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						icon: calendar,
						description: __(
							'No posts published in this period.',
							'jetpack-premium-analytics-pkg'
						),
					} }
				>
					{ /* No legend: the cell tooltips carry the counts, and the legend's
					     44px comes out of the cells. */ }
					<CalendarHeatmapPagerOverlay pager={ pager }>
						<HeatmapChartUnresponsive
							{ ...chartProps }
							primaryColor="var(--wp-admin-theme-color, #3858e9)"
							withTooltips
							renderTooltip={ renderCellTooltip }
						/>
					</CalendarHeatmapPagerOverlay>
				</WidgetState>
			) }
		</AdaptiveCalendarHeatmap>
	);
}

export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostingActivityInner />
		</WidgetRoot>
	);
}
