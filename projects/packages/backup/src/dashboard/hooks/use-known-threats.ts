import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchKnownThreats } from '../data/api/known-threats';
import { keys } from '../data/query-client';
import type { KnownThreats } from '../data/api/known-threats';

/**
 * The known Scan threats in a backup; `data` is null when they are unavailable.
 *
 * A later read that fails keeps the threats already shown, so a warning never disappears.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @param enabled  - False to leave the query idle.
 * @return The known-threats query.
 */
export function useKnownThreats( rewindId: string, enabled = true ) {
	const client = useQueryClient();
	return useQuery( {
		queryKey: keys.knownThreats( rewindId ),
		queryFn: async () =>
			( await fetchKnownThreats( rewindId ) ) ??
			client.getQueryData< KnownThreats | null >( keys.knownThreats( rewindId ) ) ??
			null,
		enabled,
	} );
}
