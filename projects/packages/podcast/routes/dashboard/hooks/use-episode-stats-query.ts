import { useQuery } from '@tanstack/react-query';
import { fetchEpisodeStats } from '../api';
import type { EpisodeStats } from '../types';

/**
 * Read plays + duration for a set of episode post IDs.
 *
 * @param postIds - Episode post IDs (from the visible page of the table).
 * @return         Query result; `data` is the per-episode stats array.
 */
export function useEpisodeStatsQuery( postIds: number[] ) {
	// Sort so the cache key is stable regardless of incoming order.
	const sortedIds = [ ...postIds ].sort( ( a, b ) => a - b );

	return useQuery< EpisodeStats[] >( {
		queryKey: [ 'jetpack-podcast', 'episode-stats', sortedIds ],
		queryFn: () => fetchEpisodeStats( sortedIds ),
		enabled: sortedIds.length > 0,
		// Mirrors the 5-minute server-side cache on the wpcom endpoint.
		staleTime: 5 * 60 * 1000,
	} );
}
