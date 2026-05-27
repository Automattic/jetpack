/**
 * `useBlackboxAggregates` — per-category aggregate counts from the
 * Blackbox-aggregates proxy.
 *
 * The PHP handler serves a deterministic mock unless
 * `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is on AND the site is enrolled.
 * The browser never sees the difference — both branches return the same
 * shape, distinguishable only by `data.preview`.
 */
import { useQuery } from '@tanstack/react-query';
import { blackboxAggregatesQuery } from '@/data/queries';
import type { BlackboxCategory, StatsInterval } from '@/lib/types';

/**
 * Fetch Blackbox aggregates for one category + interval.
 *
 * @param category - Blackbox category (logins / bots / brute-force / forms).
 * @param interval - Window the aggregate covers.
 * @return TanStack query result for `BlackboxAggregates`.
 */
export function useBlackboxAggregates( category: BlackboxCategory, interval: StatsInterval ) {
	return useQuery( blackboxAggregatesQuery( category, interval ) );
}
