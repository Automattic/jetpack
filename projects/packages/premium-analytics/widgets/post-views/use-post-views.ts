/**
 * External dependencies
 */
import {
	useStatsPost,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsPostDay,
} from '@jetpack-premium-analytics/data';
import {
	getRangeBuckets,
	parseSiteDateTime,
	type RangeBucket,
} from '@jetpack-premium-analytics/datetime';
import { toDayRange } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * One chart point: the first and last day of the bucket that fall in the range,
 * and the views summed into it.
 */
export type PostViewsPoint = {
	date: Date;
	endDate?: Date;
	value: number;
};

/**
 * Normalized Post views state: the view series plus the request's load/error
 * flags. `hasData` distinguishes the first load from refetches.
 */
export interface PostViewsState {
	current: PostViewsPoint[];
	postType?: string;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	isPlaceholderData: boolean;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Sum the post's daily view history into zero-filled buckets — missing days are
 * genuine zeroes, not gaps. Bucketed client-side since the endpoint's `weeks`
 * field only covers a fixed recent window.
 */
function bucketDays( days: StatsPostDay[], buckets: RangeBucket[] ): PostViewsPoint[] {
	const totals = new Map< string, number >( buckets.map( bucket => [ bucket.date, 0 ] ) );

	for ( const day of days ) {
		const bucket = buckets.find(
			candidate => day.date >= candidate.from && day.date <= candidate.to
		);
		if ( bucket ) {
			totals.set( bucket.date, ( totals.get( bucket.date ) ?? 0 ) + day.views );
		}
	}

	// `parseSiteDateTime` keeps the site-local day key round-tripping through the
	// chart's same-zone labels; a null parse can't happen with `format()`-built keys.
	return buckets.flatMap( bucket => {
		// The clipped bounds, so the tooltip names a month the range cuts by its days.
		const date = parseSiteDateTime( bucket.from );
		const endDate = parseSiteDateTime( bucket.to );
		const value = totals.get( bucket.date ) ?? 0;
		return date ? [ endDate ? { date, endDate, value } : { date, value } ] : [];
	} );
}

/**
 * Fetch the scoped post's view trend and slice it to the report params' window
 * client-side. A `postId` of 0 disables the request; comparison params are
 * ignored since the post detail design has no period-over-period comparison.
 */
export default function usePostViews(
	postId: number,
	reportParams: ReportParams,
	period: StatsChartBucketPeriod
): PostViewsState {
	const { data, isLoading, isFetching, isError, isPlaceholderData, refetch } = useStatsPost( {
		postId,
		// Matches the highlights card's fields so both share one `stats/post` query.
		fields: [ 'data', 'like_count', 'post' ],
	} );

	const current = useMemo( () => {
		const days = data?.data ?? [];
		const range = toDayRange( reportParams.from, reportParams.to );
		const buckets = range ? getRangeBuckets( range, period ) : [];

		return bucketDays( days, buckets );
	}, [ data, period, reportParams.from, reportParams.to ] );

	return {
		current,
		postType: data?.post?.post_type,
		isLoading,
		isFetching,
		isError,
		isPlaceholderData,
		hasData: !! data,
		refetch,
	};
}
