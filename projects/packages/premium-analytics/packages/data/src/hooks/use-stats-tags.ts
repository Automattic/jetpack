/**
 * Internal dependencies
 */
import { statsTagsQuery } from '../queries/stats-tags-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';
import type { StatsTagsResponse } from '../queries/stats-tags-query';

export type { StatsTagsResponse } from '../queries/stats-tags-query';

export function useStatsTags( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsReportParams, StatsTagsResponse >(
		statsTagsQuery,
		params,
		'tags',
		options
	);
}
