/**
 * Internal dependencies
 */
import { statsHighlightsQuery } from '../queries/stats-highlights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsHighlights( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsHighlightsQuery( params ), options );
}
