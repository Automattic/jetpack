/**
 * External dependencies
 */
import { getDefaultQueryParams, useStatsStreak } from '@jetpack-premium-analytics/data';
import { PRESET_LAST_12_MONTHS, getDatePart } from '@jetpack-premium-analytics/datetime';
import {
	MonthCalendarHeatmap,
	MonthCalendarHeatmapSkeleton,
	WidgetRoot,
	WidgetState,
	describeError,
	useReportActions,
	type CsvColumn,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n, sprintf } from '@wordpress/i18n';
import { postContent } from '@wordpress/icons';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * The Monthly posting activity widget has no configurable settings: it always shows the
 * last 12 months.
 */
export type PostingActivityAttributes = Record< never, never >;

// The card reports on its own pinned window and reads nothing from the host's
// `reportParams`, but the host still injects them and `WidgetRoot` still takes
// them, so the render type keeps composing the field.
type PostingActivityRenderAttributes = PostingActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostingActivityWidgetProps = WidgetRenderProps< PostingActivityRenderAttributes >;

// Shared so a pending or failed fetch doesn't hand the calendar a fresh object
// every render, which would rebuild all twelve months each time.
const NO_POSTS_BY_DAY: Record< string, number | null > = {};

// The endpoint keeps the newest 1095 posts unless told otherwise, which a busy
// site outruns inside 12 months.
const STREAK_MAX_POSTS = 3000;

type PostsOnDay = { day: string; posts: number };

const CSV_COLUMNS: CsvColumn< PostsOnDay >[] = [
	{ label: __( 'Date', 'jetpack-premium-analytics-pkg' ), getValue: row => row.day },
	{ label: __( 'Posts', 'jetpack-premium-analytics-pkg' ), getValue: row => row.posts },
];

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
	const { from, to, preset, interval } = getDefaultQueryParams( false, PRESET_LAST_12_MONTHS );
	const range = useMemo(
		() => ( { start: getDatePart( from ), end: getDatePart( to ) } ),
		[ from, to ]
	);
	// The query derives the request's start and end days from `from` / `to` itself.
	const streakParams = useMemo(
		() => ( { from, to, preset, interval, max: STREAK_MAX_POSTS } ),
		[ from, to, preset, interval ]
	);

	const { data, isLoading, isFetching, isError, error, refetch } = useStatsStreak( streakParams );

	// The endpoint returns only days with posts.
	const postsByDay = data ?? NO_POSTS_BY_DAY;

	const csvRows = useMemo(
		() =>
			Object.values( postsByDay ).some( count => ( count ?? 0 ) > 0 )
				? eachDayOfInterval( { start: parseISO( range.start ), end: parseISO( range.end ) } ).map(
						date => {
							const day = format( date, 'yyyy-MM-dd' );
							return { day, posts: postsByDay[ day ] ?? 0 };
						}
					)
				: [],
		[ postsByDay, range ]
	);
	useReportActions( {
		csv: {
			rows: csvRows,
			columns: CSV_COLUMNS,
			filenamePrefix: 'posting-activity',
			hasDateRange: true,
			range: { from: range.start, to: range.end },
			status: { isLoading, isFetching, isError },
		},
	} );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The query keeps the previous response via `placeholderData`, so only
			// surface the error when there is nothing to show.
			isError={ isError && ! data }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load posting activity. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			renderLoading={ <MonthCalendarHeatmapSkeleton /> }
		>
			<MonthCalendarHeatmap
				valueByDay={ postsByDay }
				range={ range }
				formatValue={ formatPostCount }
				emptyLabel={ __( 'No posts', 'jetpack-premium-analytics-pkg' ) }
				icon={ postContent }
				lessLabel={ __( 'Fewer posts', 'jetpack-premium-analytics-pkg' ) }
				moreLabel={ __( 'More posts', 'jetpack-premium-analytics-pkg' ) }
			/>
		</WidgetState>
	);
}

/**
 * Ported from the Jetpack Stats "Posting activity" module: one mini calendar per
 * month of the last 12, shaded by the posts published each day.
 */
export default function PostingActivity( { attributes = {} }: PostingActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostingActivityInner />
		</WidgetRoot>
	);
}
