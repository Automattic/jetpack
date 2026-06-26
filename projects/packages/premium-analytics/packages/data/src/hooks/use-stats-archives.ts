/**
 * Internal dependencies
 */
import { statsArchivesQuery } from '../queries/stats-archives-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsArchivesItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsArchivesResponse = StatsNormalizedReport< StatsArchivesItem >;

export function useStatsArchives( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsArchivesQuery,
		params,
		[ 'stats', 'archives', '__comparison__', 'disabled' ],
		options
	);
}
