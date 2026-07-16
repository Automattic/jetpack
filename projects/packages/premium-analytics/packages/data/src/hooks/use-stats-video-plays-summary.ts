/**
 * Internal dependencies
 */
import { statsVideoPlaysSummaryQuery } from '../queries/stats-video-plays-summary-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsVideoPlaysSummaryParams } from '../queries/stats-video-plays-summary-query';

export type { StatsVideoPlaysSummaryParams } from '../queries/stats-video-plays-summary-query';

export function useStatsVideoPlaysSummary(
	params: StatsVideoPlaysSummaryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsVideoPlaysSummaryQuery( params ), options );
}
