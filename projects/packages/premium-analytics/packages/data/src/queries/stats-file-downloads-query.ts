/**
 * Internal dependencies
 */
import {
	statsReportQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

export const statsFileDownloadsQuery = (
	params: StatsReportParams
): StatsReportQueryOptions< 'fileDownloads' > =>
	statsReportQuery(
		'file-downloads',
		'stats/file-downloads',
		params,
		'fileDownloads',
		'1.1',
		undefined,
		{
			omitParams: [ 'days' ],
		}
	);
