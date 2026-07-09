import { useQuery } from '@tanstack/react-query';
import { fetchFixThreatsStatus } from './fetchers';
import type { FixThreatsStatusResponse, ThreatFixStatus } from './types';

const POLL_INTERVAL_MS = 2_000;

const TERMINAL_STATUSES: ReadonlySet< ThreatFixStatus > = new Set( [
	'fixed',
	'not_fixed',
	'not_found',
] );

/**
 * Whether every threat in the response has reached a terminal state
 * (fixed / not_fixed / not_found).
 *
 * @param response - The status payload from `/threats/fix-status`.
 * @return Whether the fixer is done for every requested threat.
 */
export function isFixComplete( response: FixThreatsStatusResponse | undefined ): boolean {
	if ( ! response ) {
		return false;
	}
	const statuses = Object.values( response.threats ?? {} );
	if ( statuses.length === 0 ) {
		return true;
	}
	return statuses.every( entry => TERMINAL_STATUSES.has( entry.status ) );
}

/**
 * Poll the fix-status endpoint every 2 s while the auto-fixer is running
 * for any of the supplied threat ids. Stops polling once every threat
 * has reached a terminal state — the consumer (Phase 4 bulk-fix modal)
 * decides what to render based on the resolved statuses.
 *
 * @param threatIds - Threat ids to poll for. `null` / empty pauses polling.
 * @return TanStack query handle.
 */
export function useFixThreatsStatusQuery( threatIds: ReadonlyArray< string | number > | null ) {
	const ids = threatIds && threatIds.length > 0 ? threatIds : null;

	return useQuery< FixThreatsStatusResponse, Error >( {
		queryKey: [ 'jetpack', 'site', 'scan', 'fix-status', ids ?? [] ] as const,
		queryFn: () => fetchFixThreatsStatus( ids ?? [] ),
		enabled: ids !== null,
		refetchInterval: query => ( isFixComplete( query.state.data ) ? false : POLL_INTERVAL_MS ),
		refetchOnWindowFocus: false,
	} );
}
