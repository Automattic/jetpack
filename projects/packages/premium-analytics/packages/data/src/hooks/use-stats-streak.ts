/**
 * Internal dependencies
 */
import { statsStreakQuery } from '../queries/stats-streak-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsStreak( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsStreakQuery( params ), options );
}
