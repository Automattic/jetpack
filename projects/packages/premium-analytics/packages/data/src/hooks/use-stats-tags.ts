/**
 * Internal dependencies
 */
import { statsTagsQuery } from '../queries/stats-tags-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsTags( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsTagsQuery, params, 'tags', options );
}
