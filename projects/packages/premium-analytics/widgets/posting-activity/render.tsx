/**
 * External dependencies
 */
import { getDefaultQueryParams, useStatsStreak } from '@jetpack-premium-analytics/data';
import { PRESET_LAST_12_MONTHS, getDatePart } from '@jetpack-premium-analytics/datetime';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	MonthCalendarHeatmap,
	MonthCalendarHeatmapSkeleton,
	WidgetRoot,
	WidgetState,
	describeError,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { PostingActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The card reports on its own pinned window and reads nothing from the host's
// `reportParams`, but the host still injects them and `WidgetRoot` still takes
// them, so the render type keeps composing the field.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

// Shared so a pending or failed fetch doesn't hand the calendar a fresh object
// every render, which would rebuild all twelve months each time.
const NO_POSTS_BY_DAY: Record< string, number | null > = {};

const formatPostCount = ( count: number ) =>
	sprintf(
		/* translators: %d: number of posts published that day, e.g. "3". */
		_n( '%d post', '%d posts', count, 'jetpack-premium-analytics-pkg' ),
		count
	);

/**
 * `stats/streak` returns a `{ 'yyyy-MM-dd': count }` map for the last 12 months,
 * the window the old Stats card showed, whatever date state the dashboard is in.
 */
function PostingActivityInner() {
	// Resolved per render rather than once at module load, so the window is never
	// older than the render that reads it.
	const { from, to, preset, interval } = getDefaultQueryParams( false, PRESET_LAST_12_MONTHS );
	const range = useMemo(
		() => ( { start: getDatePart( from ) ?? '', end: getDatePart( to ) ?? '' } ),
		[ from, to ]
	);
	const streakParams = useMemo(
		() => ( { from, to, preset, interval, startDate: range.start, endDate: range.end } ),
		[ from, to, preset, interval, range ]
	);

	const { data, isLoading, isFetching, isError, error, refetch } = useStatsStreak( streakParams );

	// The endpoint returns only days with posts. Days outside the range are ruled
	// out so a stale response cannot suppress the empty state.
	const postsByDay = data ?? NO_POSTS_BY_DAY;
	const hasData = useMemo(
		() =>
			Object.entries( postsByDay ).some(
				( [ day, count ] ) => day >= range.start && day <= range.end && Number( count ) > 0
			),
		[ postsByDay, range ]
	);

	return (
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
					'No posts published in the last 12 months.',
					'jetpack-premium-analytics-pkg'
				),
			} }
			renderLoading={ <MonthCalendarHeatmapSkeleton /> }
		>
			<MonthCalendarHeatmap
				valueByDay={ postsByDay }
				range={ range }
				ariaLabel={ __( 'Monthly posting activity', 'jetpack-premium-analytics-pkg' ) }
				formatValue={ formatPostCount }
				emptyLabel={ __( 'No posts', 'jetpack-premium-analytics-pkg' ) }
				lessLabel={ __( 'Fewer posts', 'jetpack-premium-analytics-pkg' ) }
				moreLabel={ __( 'More posts', 'jetpack-premium-analytics-pkg' ) }
			/>
		</WidgetState>
	);
}

export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostingActivityInner />
		</WidgetRoot>
	);
}
