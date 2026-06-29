/**
 * Internal dependencies
 */
import { statsTagsQuery } from '../queries/stats-tags-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport, StatsTagsItem } from '../processing/stats';
import type { StatsTagsParams } from '../queries/stats-tags-query';

export type StatsTagsResponse = StatsNormalizedReport< StatsTagsItem >;
export type { StatsTagsParams } from '../queries/stats-tags-query';

export function useStatsTags( params: StatsTagsParams = {}, options?: UseStatsOptions ) {
	return useStatsQuery< StatsTagsResponse >( statsTagsQuery( params ), options );
}
