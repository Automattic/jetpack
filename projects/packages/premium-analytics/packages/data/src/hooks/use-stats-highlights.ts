/**
 * Internal dependencies
 */
import { statsHighlightsQuery } from '../queries/stats-highlights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsHighlightsParams,
	StatsHighlightsResponse,
} from '../queries/stats-highlights-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type {
	StatsHighlightsParams,
	StatsHighlightsResponse,
} from '../queries/stats-highlights-query';

export function useStatsHighlights(
	params?: StatsHighlightsParams,
	options?: UseStatsOptions
): UseQueryResult< StatsHighlightsResponse > {
	return useStatsQuery( statsHighlightsQuery( params ), options );
}
