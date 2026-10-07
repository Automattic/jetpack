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
};

export const statsAuthorQuery = (
	authorId: number,
	{ period, from, to, num }: StatsAuthorParams
): StatsReportQueryOptions< 'author' > => {
	const { start_date: startDate, end_date: endDate } = reportParamsToStatsQueryParams( {
		from,
		to,
	} );

	return {
		...statsProxyQuery( {
			name: 'author',
			version: '1.1',
			endpoint: `stats/author/${ authorId }`,
			params: {
				period,
				...( num === undefined ? {} : { num } ),
				...( num === undefined && startDate ? { start_date: startDate } : {} ),
				...( num === undefined && endDate ? { end_date: endDate } : {} ),
			},
			sanitizer: 'author',
			enabled: Number.isInteger( authorId ) && authorId > 0,
		} ),
		// An author past the endpoint's post limit stays past it.
		retry: ( failureCount, error ) =>
			getApiErrorCode( error ) !== 'too_many_posts' && shouldRetryApiError( failureCount, error ),
	};
};
