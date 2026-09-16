/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import {
	createTZDateFromParts,
	localTZDate,
	parseSiteDateTime,
	reportingTimeZone,
} from '@jetpack-premium-analytics/datetime';
import type { MonthKey, MonthlyHeatmapMetric } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildAllTimeTrafficRows, type AllTimeTrafficRow } from './build-all-time-traffic-rows';

export interface PostAllTimeTrafficState {
	rows: AllTimeTrafficRow[];
	/** Where the post's life starts, which a picked period never precedes. */
	lifeStartsAt: Date | undefined;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

/**
 * The publish day, unless the endpoint reports an earlier month: a rescheduled
 * post keeps the views from before its new date, and those months open whole.
 */
function lifeStart(
	rows: AllTimeTrafficRow[],
	publishedAt: Date | undefined,
	publishedMonth: MonthKey | undefined
): Date | undefined {
	const oldest = rows[ rows.length - 1 ];
	const month = oldest?.months.findIndex( value => typeof value === 'number' ) ?? -1;

	if ( ! oldest || month < 0 ) {
		return publishedAt;
	}

	if ( publishedMonth && oldest.year === publishedMonth.year && month === publishedMonth.month ) {
		return publishedAt;
	}

	return new Date(
		createTZDateFromParts( [ oldest.year, month, 1 ], reportingTimeZone() ).getTime()
	);
}

/**
 * Every month of the post's views, one row per year. All-time regardless of
 * the page's period: the endpoint's yearly tables cover the post's whole life.
 * A `postId` of 0 disables the request.
 *
 * @param postId - The post the page is scoped to.
 * @param metric - Which number each cell reports.
 * @return The rows and the request's state.
 */
export default function usePostAllTimeTraffic(
	postId: number,
	metric: MonthlyHeatmapMetric
): PostAllTimeTrafficState {
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsPost( {
		postId,
		fields: [ 'years', 'averages', 'post' ],
	} );

	// Same reading as the page header: a site-local wall time, or the GMT stamp
	// pinned to UTC when that is all the row carries.
	const publishedAt = useMemo( () => {
		const post = data?.post;

		return parseSiteDateTime(
			post?.post_date ?? ( post?.post_date_gmt ? `${ post.post_date_gmt }Z` : undefined )
		);
	}, [ data ] );

	const { rows, lifeStartsAt } = useMemo( () => {
		// Read in the site timezone so the months fall on the site's own calendar.
		const today = localTZDate();
		const published = publishedAt ? localTZDate( publishedAt ) : undefined;
		const publishedMonth = published && {
			year: published.getFullYear(),
			month: published.getMonth(),
		};
		const built = buildAllTimeTrafficRows(
			data,
			metric,
			{ year: today.getFullYear(), month: today.getMonth() },
			publishedMonth
		);

		return { rows: built, lifeStartsAt: lifeStart( built, publishedAt, publishedMonth ) };
	}, [ data, metric, publishedAt ] );

	return {
		rows,
		lifeStartsAt,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	};
}
