/**
 * External dependencies
 */
import { useStatsStreak } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	AdaptiveCalendarHeatmap,
	CalendarHeatmapPagerOverlay,
	CalendarHeatmapTooltip,
	HeatmapChartUnresponsive,
	HeatmapSkeleton,
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
 * `stats/streak` returns a `{ 'yyyy-MM-dd': count }` map with no comparison
 * period. The fetch window is capped at the widest tile's history, so a long
 * selection can't request years the grid would discard.
 */
function PostingActivityInner() {
	const { reportParams } = useWidgetRootContext();

	// A ceiling but no floor: a floor would reach back past the selection, putting
	// years outside the card's heading inside it (WOOA7S-1963).
	const viewportWidth = useViewportWidth();
	const windowDays = resolveCalendarHeatmapWindowDays( viewportWidth );

	// One reading for both windows below, so a render across midnight cannot resolve
	// them against different days.
	const today = format( new Date(), 'yyyy-MM-dd' );

	// Both the request window and the range the heatmap draws and pages through:
	// without a floor the two coincide, so paging can never leave the selection.
	const streakRange = useMemo(
		() => resolveCalendarHeatmapWindow( reportParams, { maxDays: windowDays }, today ),
		[ reportParams, windowDays, today ]
	);

	// The period as selected, before the ceiling: the empty state has to know the
	// response says nothing about the years the ceiling left out.
	const periodWindow = useMemo(
		() => resolveCalendarHeatmapWindow( reportParams, {}, today ),
		[ reportParams, today ]
	);
	const isWindowClipped = periodWindow.startDate < streakRange.startDate;
	const streakParams = useMemo(
		() => ( { ...reportParams, startDate: streakRange.startDate, endDate: streakRange.endDate } ),
		[ reportParams, streakRange ]
	);

	const { data, isLoading, isFetching, isError, error, refetch } = useStatsStreak( streakParams );

	// The endpoint returns only days with posts. Days outside the range are ruled
	// out so a stale response for a wider selection cannot suppress the empty state.
	const postsByDay = data ?? NO_POSTS_BY_DAY;
	const hasData = useMemo(
		() =>
			Object.entries( postsByDay ).some(
				( [ day, count ] ) =>
					day >= streakRange.startDate && day <= streakRange.endDate && Number( count ) > 0
			),
		[ postsByDay, streakRange ]
	);

	// Where the period outran the window, name the days the request covers rather
	// than the period: the site may well have posts outside them.
	const windowStart = parseSiteDateTime( streakRange.startDate );
	const windowEnd = parseSiteDateTime( streakRange.endDate );
	const emptyDescription =
		isWindowClipped && windowStart && windowEnd
			? sprintf(
					/* translators: 1: first date the request covers, e.g. "Aug 9, 2024". 2: last date it covers. */
					__( 'No posts published between %1$s and %2$s.', 'jetpack-premium-analytics-pkg' ),
					formatDate( windowStart, 'compact' ),
					formatDate( windowEnd, 'compact' )
			  )
			: __( 'No posts published in this period.', 'jetpack-premium-analytics-pkg' );

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
						description: emptyDescription,
					} }
					renderLoading={ <HeatmapSkeleton /> }
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
