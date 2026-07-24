/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export const statsSearchTermsQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'searchTerms' > => {
	const rangeParams = reportParamsToStatsQueryParams( params );
	const rangeDays = rangeParams.days;

	/*
	 * The Search Terms endpoint derives the inclusive range from start_date and
	 * date. Match legacy Stats by omitting the generic report-layer `days`
	 * parameter while preserving the shared automatic summary mode for
	 * multi-day consumers.
	 */
	delete rangeParams.days;

	return statsProxyQuery( {
		name: 'search-terms',
		version: '1.1',
		endpoint: 'stats/search-terms',
		params: {
			...rangeParams,
			...( params.period === undefined ? { period: 'day' } : {} ),
			...( rangeParams.summarize === undefined && typeof rangeDays === 'number' && rangeDays > 1
				? { summarize: 1 }
				: {} ),
		},
		sanitizer: 'searchTerms',
		enabled: !! ( rangeParams.end_date || rangeParams.date || rangeParams.start_date ),
	} );
};
