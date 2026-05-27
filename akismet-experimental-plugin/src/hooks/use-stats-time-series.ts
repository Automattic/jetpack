/**
 * `useStatsTimeSeries` — Comments per-bucket series for the requested
 * interval. Backs the Comments card's sparkline.
 */
import { useQuery } from '@tanstack/react-query';
import { statsTimeseriesQuery } from '@/data/queries';
import type { StatsInterval } from '@/lib/types';

/**
 * Fetch the Comments time-series for one interval.
 *
 * @param interval - Window the series covers.
 * @return TanStack query result for `StatsTimeseries`.
 */
export function useStatsTimeSeries( interval: StatsInterval ) {
	return useQuery( statsTimeseriesQuery( interval ) );
}
