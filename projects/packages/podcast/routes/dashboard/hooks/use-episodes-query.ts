/**
 * TanStack Query hook for fetching podcast episodes.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchEpisodes, type EpisodesQueryArgs, type EpisodesPage } from '../api';

/**
 * Read a page of podcast episodes. Disabled until a category is configured;
 * keeps the previous page visible during pagination so the table doesn't flash
 * empty on each navigation.
 *
 * @param args - Pagination, sort, search, and status filter args.
 * @return      Query result with `data.episodes` and pagination metadata.
 */
export function useEpisodesQuery( args: EpisodesQueryArgs ) {
	return useQuery< EpisodesPage >( {
		queryKey: [ 'jetpack-podcast', 'episodes', args ],
		queryFn: () => fetchEpisodes( args ),
		enabled: args.categoryId > 0,
		placeholderData: keepPreviousData,
	} );
}
