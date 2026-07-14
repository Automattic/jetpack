/**
 * External dependencies
 */
import {
	useStatsPost,
	type ReportParams,
	type StatsPostDay,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Normalized highlights state: the three metric values plus the request's
 * load/error flags. `hasData` distinguishes the first load from refetches.
 */
export interface PostHighlightsState {
	/** Views in the primary window (all-time when the window is missing). */
	views: number;
	/**
	 * Views in the comparison window; `null` when comparison is requested but
	 * no window can be derived, `undefined` when comparison is off.
	 */
	viewsPrevious?: number | null;
	/** Lifetime comment count. */
	comments: number;
	/** Lifetime like count. */
	likes: number;
	/** Whether comparison is requested (`comp === '1'` in the report params). */
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	hasData: boolean;
	refetch: () => void;
}

/**
 * Extract a shape-validated `YYYY-MM-DD` day from an ISO report param. The
 * params originate from URL search params; days are only compared as strings
 * here, so shape validation is sufficient (a malformed bound simply matches
 * no history days).
 *
 * @param value - The ISO date-time string.
 * @return The date-only day, or undefined when missing/malformed.
 */
function toDay( value?: string ): string | undefined {
	const day = value?.slice( 0, 10 );
	return day && /^\d{4}-\d{2}-\d{2}$/.test( day ) ? day : undefined;
}

/**
 * Sum the post's daily views inside an inclusive date-only window. Date keys
 * are `YYYY-MM-DD`, so plain string comparison is chronological.
 *
 * @param days - The post's daily views.
 * @param from - The window start day.
 * @param to   - The window end day.
 * @return The summed views.
 */
function sumViews( days: StatsPostDay[], from: string, to: string ): number {
	let total = 0;

	for ( const day of days ) {
		if ( day.date >= from && day.date <= to ) {
			total += day.views;
		}
	}

	return total;
}

/**
 * Fetch the scoped post's highlight metrics. One `stats/post` request carries
 * everything: the daily view history (summed client-side into the primary and
 * comparison windows, so comparison needs no second request) and the lifetime
 * comment/like totals.
 *
 * @param postId       - The scoped post ID (0 disables the request).
 * @param reportParams - The dashboard date range + comparison state.
 * @return The highlight metrics and load/error state.
 */
export default function usePostHighlights(
	postId: number,
	reportParams: ReportParams
): PostHighlightsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsPost( {
		postId,
		fields: [ 'data', 'like_count', 'post' ],
	} );

	const metrics = useMemo( () => {
		const days = data?.data ?? [];
		const from = toDay( reportParams.from );
		const to = toDay( reportParams.to );
		const compareFrom = toDay( reportParams.compare_from );
		const compareTo = toDay( reportParams.compare_to );
		// `comp` is the comparison toggle in the report params contract; the
		// compare bounds may be missing or malformed in a hand-edited deep link,
		// in which case comparison is on but has no comparable window.
		const hasComparison = reportParams.comp === '1';

		// The history covers every day since publication, so the unwindowed sum
		// is the all-time total.
		const views =
			from && to
				? sumViews( days, from, to )
				: days.reduce( ( total, day ) => total + day.views, 0 );

		let viewsPrevious: number | null | undefined;
		if ( hasComparison ) {
			viewsPrevious = compareFrom && compareTo ? sumViews( days, compareFrom, compareTo ) : null;
		}

		return {
			views,
			viewsPrevious,
			comments: Number( data?.post?.comment_count ) || 0,
			likes: data?.like_count ?? 0,
			hasComparison,
		};
	}, [
		data,
		reportParams.comp,
		reportParams.from,
		reportParams.to,
		reportParams.compare_from,
		reportParams.compare_to,
	] );

	return {
		...metrics,
		isLoading,
		isFetching,
		isError,
		hasData: !! data,
		refetch,
	};
}
