/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsFileDownloadsQuery } from '../queries/stats-file-downloads-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsFileDownloads( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsFileDownloadsQuery,
		params,
		[ 'stats', 'file-downloads', '__comparison__', 'disabled' ],
		options
	);
}
