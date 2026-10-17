import { useQuery } from '@tanstack/react-query';
import { fetchKnownThreats } from '../data/api/known-threats';
import { keys } from '../data/query-client';

/**
 * The known Scan threats in a backup; `data` is null when they are unavailable.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @param enabled  - False to leave the query idle.
 * @return The known-threats query.
 */
export function useKnownThreats( rewindId: string, enabled = true ) {
	return useQuery( {
		queryKey: keys.knownThreats( rewindId ),
		queryFn: () => fetchKnownThreats( rewindId ),
		enabled,
	} );
}
