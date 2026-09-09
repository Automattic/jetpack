/**
 * External dependencies
 */
import { useStatsPost } from '@jetpack-premium-analytics/data';
import { localTZDate, parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildAllTimeTrafficRows, type AllTimeTrafficRow } from './build-all-time-traffic-rows';

export interface PostAllTimeTrafficState {
	rows: AllTimeTrafficRow[];
	/** When the post was published, read from the endpoint's post row. */
	publishedAt: Date | undefined;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

/**
 * Every month of the post's views, one row per year. All-time regardless of
 * the page's period: the endpoint's yearly tables cover the post's whole life.
 * A `postId` of 0 disables the request.
 *
 * @param postId - The post the page is scoped to.
 * @return The rows and the request's state.
 */
export default function usePostAllTimeTraffic( postId: number ): PostAllTimeTrafficState {
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsPost( {
		postId,
		fields: [ 'years', 'post' ],
	} );

	// Same reading as the page header: a site-local wall time, or the GMT stamp
	// pinned to UTC when that is all the row carries.
	const publishedAt = useMemo( () => {
		const post = data?.post;

		return parseSiteDateTime(
			post?.post_date ?? ( post?.post_date_gmt ? `${ post.post_date_gmt }Z` : undefined )
		);
	}, [ data ] );

	const rows = useMemo( () => {
		// Read in the site timezone so the months fall on the site's own calendar.
		const today = localTZDate();
		const published = publishedAt ? localTZDate( publishedAt ) : undefined;

		return buildAllTimeTrafficRows(
			data,
			{ year: today.getFullYear(), month: today.getMonth() },
			published && { year: published.getFullYear(), month: published.getMonth() }
		);
	}, [ data, publishedAt ] );

	return {
		rows,
		publishedAt,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	};
}
