/**
 * Internal dependencies
 */
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsVideoPlays( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsVideoPlaysQuery, params, 'video-plays', options );
}
