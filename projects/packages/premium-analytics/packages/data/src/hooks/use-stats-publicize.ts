/**
 * Internal dependencies
 */
import { statsPublicizeQuery } from '../queries/stats-publicize-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsPublicize( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsPublicizeQuery,
		params,
		[ 'stats', 'publicize', '__comparison__', 'disabled' ],
		options
	);
}
