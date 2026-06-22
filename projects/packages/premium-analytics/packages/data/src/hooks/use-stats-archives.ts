/**
 * Internal dependencies
 */
import { statsArchivesQuery } from '../queries/stats-archives-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsArchives( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsArchivesQuery,
		params,
		[ 'stats', 'archives', '__comparison__', 'disabled' ],
		options
	);
}
