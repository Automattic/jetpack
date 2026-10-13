/**
 * Internal dependencies
 */
import { getApiErrorCode, shouldRetryApiError } from '../utils/api-error';
import { reportParamsToStatsQueryParams, type StatsPeriod } from '../utils/stats-params';
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';

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
		// An author past the endpoint's post limit stays past it, so nothing but an
		// explicit refetch asks again: a focus, poll or mounting card clearing the
		// error would also drop the author page off its approximate fallback.
		enabled: query => isAuthor && ! isOverPostLimit( query.state.error ),
		retry: ( failureCount, error ) =>
			! isOverPostLimit( error ) && shouldRetryApiError( failureCount, error ),
	};
};
