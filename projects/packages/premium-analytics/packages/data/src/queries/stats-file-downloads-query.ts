/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export const statsFileDownloadsQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'fileDownloads' > => {
	const rangeParams = reportParamsToStatsQueryParams( params );
	const rangeDays = rangeParams.days;

	// Match Calypso's custom-range request. The endpoint derives the number of
	// periods from `start_date` and `date`, so the generic `days` parameter is
	// redundant and is not part of the legacy request.
	delete rangeParams.days;

	return statsProxyQuery( {
		name: 'file-downloads',
		version: '1.1',
		endpoint: 'stats/file-downloads',
		params: {
			...rangeParams,
			// This is a day-bucketed list report: the dashboard's chart interval
			// must not leak in as the period, or a long range would be counted in
			// weeks/months instead of days. Callers can still force one explicitly.
			...( params.period === undefined ? { period: 'day' } : {} ),
			...( rangeParams.summarize === undefined && typeof rangeDays === 'number' && rangeDays > 1
				? { summarize: 1 }
				: {} ),
		},
		sanitizer: 'fileDownloads',
		enabled: !! ( rangeParams.end_date || rangeParams.date || rangeParams.start_date ),
	} );
};
