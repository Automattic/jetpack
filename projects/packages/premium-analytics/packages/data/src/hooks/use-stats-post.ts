/**
 * Internal dependencies
 */
import { statsPostQuery } from '../queries/stats-post-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsPostParams, StatsPostResponse } from '../queries/stats-post-query';

export type {
	StatsPostField,
	StatsPostParams,
	StatsPostResponse,
} from '../queries/stats-post-query';

export function useStatsPost( params: StatsPostParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsPostResponse >( statsPostQuery( params ), options );
}
