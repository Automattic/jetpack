/**
 * Internal dependencies
 */
import { statsCommentsQuery } from '../queries/stats-comments-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsCommentsParams, StatsCommentsResponse } from '../queries/stats-comments-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type { StatsCommentsParams, StatsCommentsResponse };

export function useStatsComments(
	params?: StatsCommentsParams,
	options?: UseStatsOptions
): UseQueryResult< StatsCommentsResponse > {
	return useStatsQuery< StatsCommentsResponse >( statsCommentsQuery( params ), options );
}
