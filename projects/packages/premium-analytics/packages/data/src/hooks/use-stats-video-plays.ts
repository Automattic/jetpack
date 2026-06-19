/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsVideoPlaysQuery } from '../queries/stats-video-plays-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsVideoPlays( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsVideoPlaysQuery,
		params,
		[ 'stats', 'video-plays', '__comparison__', 'disabled' ],
		options
	);
}
