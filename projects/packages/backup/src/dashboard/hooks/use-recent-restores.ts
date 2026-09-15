import { useQuery } from '@tanstack/react-query';
import { fetchRecentRestores } from '../data/api/restore';
import { keys } from '../data/query-client';

/**
 * The site's ten most recent restores, in any state.
 *
 * One query key for every reader, so an Overview mounting several of them
 * still makes one request.
 *
 * @param enabled - False to leave the query idle.
 * @return The shared restores query.
 */
export function useRecentRestores( enabled = true ) {
	return useQuery( {
		queryKey: keys.recentRestores(),
		queryFn: fetchRecentRestores,
		enabled,
	} );
}
