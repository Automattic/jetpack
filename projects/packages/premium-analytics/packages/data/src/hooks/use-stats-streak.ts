/**
 * Internal dependencies
 */
import { statsStreakQuery } from '../queries/stats-streak-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsStreakParams, StatsStreakResponse } from '../queries/stats-streak-query';

export type { StatsStreakParams, StatsStreakResponse } from '../queries/stats-streak-query';

export function useStatsStreak( params: StatsStreakParams, options?: UseStatsOptions ) {
	return useStatsQuery< StatsStreakResponse >( statsStreakQuery( params ), options );
}
