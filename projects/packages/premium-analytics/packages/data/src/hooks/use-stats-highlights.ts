/**
 * Internal dependencies
 */
import { statsHighlightsQuery } from '../queries/stats-highlights-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsHighlightsParams } from '../queries/stats-highlights-query';

export type {
	StatsHighlightsParams,
	StatsHighlightsResponse,
} from '../queries/stats-highlights-query';

export function useStatsHighlights( params?: StatsHighlightsParams, options?: UseStatsOptions ) {
	return useStatsQuery( statsHighlightsQuery( params ), options );
}
