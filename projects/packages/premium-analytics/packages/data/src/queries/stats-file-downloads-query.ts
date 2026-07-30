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
			// The endpoint derives the number of periods from `start_date` and `date`,
			// so the generic `days` parameter is redundant and is not part of the
			// legacy Calypso request.
			omitParams: [ 'days' ],
		}
	);
