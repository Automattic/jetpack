/**
 * Internal dependencies
 */
import { statsHourOfDayQuery } from '../queries/stats-hour-of-day-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsHourOfDayReport } from '../processing/stats/hour-of-day';
import type { StatsHourOfDayParams } from '../queries/stats-hour-of-day-query';

export type { StatsHourOfDayParams } from '../queries/stats-hour-of-day-query';
export type { StatsHourOfDayBucket, StatsHourOfDayReport } from '../processing/stats/hour-of-day';

export function useStatsHourOfDay( params: StatsHourOfDayParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsHourOfDayParams, StatsHourOfDayReport >(
		statsHourOfDayQuery,
		params,
		'hour-of-day',
		options
	);
}
