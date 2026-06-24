/**
 * Internal dependencies
 */
import { statsCommentsQuery } from '../queries/stats-comments-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsCommentsItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export type StatsCommentsResponse = StatsNormalizedReport< StatsCommentsItem >;

export function useStatsComments( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCommentsQuery,
		params,
		[ 'stats', 'comments', '__comparison__', 'disabled' ],
		options
	);
}
