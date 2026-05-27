/**
 * `useStatsTotals` — Comments totals for the requested interval.
 *
 * Thin TanStack wrapper over `statsTotalsQuery()`. Per conventions doc §5
 * — the factory holds the key + queryFn; the hook stays a one-liner so
 * the caller can also reach the factory directly for prefetch/setQueryData.
 */
import { useQuery } from '@tanstack/react-query';
import { statsTotalsQuery } from '@/data/queries';
import type { StatsInterval } from '@/lib/types';

/**
 * Fetch the Comments-stats totals for one interval.
 *
 * @param interval - Window the totals cover.
 * @return TanStack query result for `StatsTotals`.
 */
export function useStatsTotals( interval: StatsInterval ) {
	return useQuery( statsTotalsQuery( interval ) );
}
