/**
 * Internal dependencies
 */
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsVideoPlays(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsVideoPlaysItem > > {
	return useStatsReport( statsVideoPlaysQuery, params, 'video-plays', options );
}
