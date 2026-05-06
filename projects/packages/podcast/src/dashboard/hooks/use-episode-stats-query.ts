/**
 * TanStack Query hook for fetching per-episode play stats and durations.
 *
 * The wpcom `/wpcom/v2/sites/{id}/podcast-stats/episode-totals` endpoint caches
 * for 5 minutes server-side; mirror that on the client so we don't refetch on
 * every tab change.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchEpisodeStats } from '../api';
import type { EpisodeStats } from '../types';

/**
 * Read plays + duration for a set of episode post IDs. Sort the IDs first so
 * the cache key is stable regardless of the order they arrived from the
 * episodes query.
 *
 * @param postIds - Episode post IDs (from the visible page of the table).
 * @return         Query result; `data` is the per-episode stats array.
 */
export function useEpisodeStatsQuery( postIds: number[] ) {
	const sortedIds = [ ...postIds ].sort( ( a, b ) => a - b );

	return useQuery< EpisodeStats[] >( {
		queryKey: [ 'jetpack-podcast', 'episode-stats', sortedIds ],
		queryFn: () => fetchEpisodeStats( sortedIds ),
		enabled: sortedIds.length > 0,
		staleTime: 5 * 60 * 1000,
	} );
}
