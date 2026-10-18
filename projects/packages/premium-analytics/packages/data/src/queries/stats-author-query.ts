/**
 * Internal dependencies
 */
import { getApiErrorCode, shouldRetryApiError } from '../utils/api-error';
import { reportParamsToStatsQueryParams, type StatsPeriod } from '../utils/stats-params';
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { StatsAuthorReport } from '../processing/stats/author';
import type { UseQueryOptions } from '@tanstack/react-query';

/** A bounded window (`from`/`to`), or a period count alone; `num: -1` is the author's whole history. */
export type StatsAuthorParams = {
	period: StatsPeriod;
	from?: string;
	to?: string;
	num?: number;
	/**
	 * Past the endpoint's post limit, read views through the site-wide ranking
	 * instead of refusing; the dates stay exact.
	 */
	approximate?: boolean;
};

/** Every month since the author's views start: `num=-1` with no window. */
export const STATS_AUTHOR_ALL_TIME_PARAMS = { period: 'month', num: -1 } as const;

// Today alone, read through the ranking: cheap even past the post limit, and
// its first content date stays exact.
const APPROXIMATE_PARAMS = { period: 'day', num: 1, approximate: true } as const;

const isOverPostLimit = ( error: unknown ) => getApiErrorCode( error ) === 'too_many_posts';

export const statsAuthorQuery = (
	authorId: number,
	{ period, from, to, num, approximate }: StatsAuthorParams
): StatsReportQueryOptions< 'author' > => {
	const { start_date: startDate, end_date: endDate } = reportParamsToStatsQueryParams( {
		from,
		to,
	} );
	const isAuthor = Number.isInteger( authorId ) && authorId > 0;

	return {
		...statsProxyQuery( {
			name: 'author',
			version: '1.1',
			endpoint: `stats/author/${ authorId }`,
			params: {
				period,
				...( num === undefined ? {} : { num } ),
				...( approximate ? { approximate: 'true' } : {} ),
				...( num === undefined && startDate ? { start_date: startDate } : {} ),
				...( num === undefined && endDate ? { end_date: endDate } : {} ),
			},
			sanitizer: 'author',
			enabled: isAuthor,
		} ),
		// An author past the endpoint's post limit stays past it.
		retry: ( failureCount, error ) =>
			! isOverPostLimit( error ) && shouldRetryApiError( failureCount, error ),
	};
};

/** An author's all-time report, or today's approximate one past the post limit. */
export type StatsAuthorAllTimeOrApproximate = {
	report: StatsAuthorReport;
	/** Whether the author is past the post limit and `report` is today's approximate read. */
	isApproximate: boolean;
};

/**
 * The author's all-time report, falling back to today's approximate one inside
 * the fetch when the author is past the post limit, so a refetch never surfaces
 * the all-time request's `too_many_posts` in between. The all-time read goes
 * through the shared cache, so the All-time traffic card does not ask again.
 *
 * @param authorId - The author's user ID; `0` disables the request.
 * @return The query options.
 */
export const statsAuthorAllTimeOrApproximateQuery = (
	authorId: number
): UseQueryOptions< StatsAuthorAllTimeOrApproximate > => {
	// The all-time read's own key carries the reporting timezone the report is sanitized in.
	const allTimeKey = statsAuthorQuery( authorId, STATS_AUTHOR_ALL_TIME_PARAMS ).queryKey;

	return {
		queryKey: [ 'stats', 'author-all-time-or-approximate', authorId, ...allTimeKey ],
		queryFn: async ( { client } ) => {
			try {
				return {
					report: await client.fetchQuery(
						statsAuthorQuery( authorId, STATS_AUTHOR_ALL_TIME_PARAMS )
					),
					isApproximate: false,
				};
			} catch ( error ) {
				if ( ! isOverPostLimit( error ) ) {
					throw error;
				}
			}

			return {
				report: await client.fetchQuery( statsAuthorQuery( authorId, APPROXIMATE_PARAMS ) ),
				isApproximate: true,
			};
		},
		enabled: Number.isInteger( authorId ) && authorId > 0,
		// Each read above already retries on its own terms.
		retry: false,
		placeholderData: previousData => previousData,
	};
};
