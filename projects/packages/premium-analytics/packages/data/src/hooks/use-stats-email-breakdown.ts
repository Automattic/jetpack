/**
 * Internal dependencies
 */
import {
	statsEmailClicksBreakdownQuery,
	statsEmailOpensBreakdownQuery,
	type StatsEmailClicksBreakdown,
	type StatsEmailOpensBreakdown,
} from '../queries/stats-email-breakdown-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsEmailOpensBreakdown(
	postId: number,
	breakdown: StatsEmailOpensBreakdown,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailOpensBreakdownQuery( postId, breakdown, params ), options );
}

export function useStatsEmailClicksBreakdown(
	postId: number,
	breakdown: StatsEmailClicksBreakdown,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsEmailClicksBreakdownQuery( postId, breakdown, params ), options );
}

export type { StatsEmailClicksBreakdown, StatsEmailOpensBreakdown };
