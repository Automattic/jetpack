import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBackupsKnownThreats, fetchKnownThreats } from '../data/api/known-threats';
import { keys } from '../data/query-client';
import type { KnownThreats } from '../data/api/known-threats';

/**
 * Whether this site checks backups for known threats. Elsewhere the routes can only answer
 * `threats_unavailable`, so the queries stay idle.
 *
 * @return Whether the known-threats queries may run.
 */
function knownThreatsAvailable(): boolean {
	return window.JPBACKUP_DASHBOARD_STATE?.knownThreatsAvailable === true;
}

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
		enabled: enabled && knownThreatsAvailable(),
	} );
}

/**
 * Known-threat counts for the newest 100 backups; `data` is null when they are unavailable.
 *
 * @param options                   - Query options.
 * @param options.withCleanRewindId - Also name when the newest clean backup finished; only a warning that links to it needs this.
 * @param options.enabled           - False to leave the query idle.
 * @return The query.
 */
export function useBackupsKnownThreats( {
	withCleanRewindId = false,
	enabled = true,
}: { withCleanRewindId?: boolean; enabled?: boolean } = {} ) {
	return useQuery( {
		queryKey: keys.backupsKnownThreats( withCleanRewindId ),
		queryFn: () => fetchBackupsKnownThreats( withCleanRewindId ),
		staleTime: 5 * 60_000,
		enabled: enabled && knownThreatsAvailable(),
	} );
}
