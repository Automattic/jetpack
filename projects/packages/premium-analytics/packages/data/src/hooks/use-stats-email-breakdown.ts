/**
 * Internal dependencies
 */
import {
	statsEmailClicksBreakdownQuery,
	statsEmailOpensBreakdownQuery,
	type StatsEmailBreakdown,
	type StatsEmailClicksBreakdown,
	type StatsEmailOpensBreakdown,
} from '../queries/stats-email-breakdown-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';

export function useStatsEmailOpensBreakdown(
	postId: number,
	breakdown: StatsEmailOpensBreakdown,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailOpensBreakdownQuery( postId, breakdown ), options );
}

export function useStatsEmailClicksBreakdown(
	postId: number,
	breakdown: StatsEmailClicksBreakdown,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailClicksBreakdownQuery( postId, breakdown ), options );
}

export type { StatsEmailBreakdown, StatsEmailClicksBreakdown, StatsEmailOpensBreakdown };
