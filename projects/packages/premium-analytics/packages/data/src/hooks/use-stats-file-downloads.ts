/**
 * Internal dependencies
 */
import { statsFileDownloadsQuery } from '../queries/stats-file-downloads-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsFileDownloadsItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsFileDownloads(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsFileDownloadsItem > > {
	return useStatsReport( statsFileDownloadsQuery, params, 'file-downloads', options );
}
