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

	// Match Calypso's custom-range request. The endpoint derives the number of
	// periods from `start_date` and `date`, so the generic `days` parameter is
	// redundant and is not part of the legacy request.
	delete rangeParams.days;

	return statsProxyQuery( {
		name: 'file-downloads',
		version: '1.1',
		endpoint: 'stats/file-downloads',
		params: rangeParams,
		sanitizer: 'fileDownloads',
		enabled: !! ( rangeParams.end_date || rangeParams.date || rangeParams.start_date ),
	} );
};
