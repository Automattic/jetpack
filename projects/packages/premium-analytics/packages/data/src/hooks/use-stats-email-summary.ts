/**
 * Internal dependencies
 */
import { statsEmailSummaryQuery } from '../queries/stats-email-summary-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsEmailSummary,
	StatsEmailSummaryParams,
	StatsEmailSummarySortField,
} from '../queries/stats-email-summary-query';
import type { UseQueryResult } from '@tanstack/react-query';

export function useStatsEmailSummary(
	params?: StatsEmailSummaryParams,
	options?: UseStatsOptions
): UseQueryResult< StatsEmailSummary > {
	return useStatsQuery( statsEmailSummaryQuery( params ), options );
}

export type { StatsEmailSummary, StatsEmailSummaryParams, StatsEmailSummarySortField };
