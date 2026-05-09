import { getSiteData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { EpisodeStats } from '../types';

// Chunked to 50 IDs to match the wpcom endpoint's max page size.
const fetchEpisodeStats = async ( postIds: number[] ): Promise< EpisodeStats[] > => {
	if ( postIds.length === 0 ) {
		return [];
	}
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	if ( ! blogId ) {
		return [];
	}

	const out: EpisodeStats[] = [];
	for ( let i = 0; i < postIds.length; i += 50 ) {
		const chunk = postIds.slice( i, i + 50 );
		const result = ( await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats/episode-totals`, {
				post_ids: chunk.join( ',' ),
			} ),
			method: 'GET',
		} ) ) as { episodes?: EpisodeStats[] } | EpisodeStats[];

		if ( Array.isArray( result ) ) {
			out.push( ...result );
		} else if ( result.episodes ) {
			out.push( ...result.episodes );
		}
	}
	return out;
};

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
