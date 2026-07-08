import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enqueueScan, fixThreats, ignoreThreat, unignoreThreat } from './fetchers';
import type { FixThreatsResponse } from './types';

// On any successful threat mutation we invalidate the three queries that
// drive the overview tabs so the table refreshes off the latest state
// instead of showing stale rows.
const SCAN_QUERY_PREFIX = [ 'jetpack', 'site', 'scan' ] as const;

/**
 * Mark a single threat as ignored.
 *
 * @return TanStack mutation handle.
 */
export function useIgnoreThreatMutation() {
	const queryClient = useQueryClient();
	return useMutation< unknown, Error, string | number >( {
		mutationFn: threatId => ignoreThreat( threatId ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } );
		},
	} );
}

/**
 * Re-activate a previously ignored threat.
 *
 * @return TanStack mutation handle.
 */
export function useUnignoreThreatMutation() {
	const queryClient = useQueryClient();
	return useMutation< unknown, Error, string | number >( {
		mutationFn: threatId => unignoreThreat( threatId ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } );
		},
	} );
}

/**
 * Trigger a fresh scan run.
 *
 * @return TanStack mutation handle.
 */
export function useEnqueueScanMutation() {
	const queryClient = useQueryClient();
	return useMutation< unknown, Error, void >( {
		mutationFn: () => enqueueScan(),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } );
		},
	} );
}

/**
 * Kick the auto-fixer for one or more threats. The mutation resolves as
 * soon as WPCOM accepts the request — the actual fixer status is polled
 * via `useFixThreatsStatusQuery` (Phase 4 wires the modal that shows
 * progress / success / failure).
 *
 * @return TanStack mutation handle.
 */
export function useFixThreatsMutation() {
	const queryClient = useQueryClient();
	return useMutation< FixThreatsResponse, Error, ReadonlyArray< string | number > >( {
		mutationFn: threatIds => fixThreats( threatIds ),
		onSuccess: () => {
			// Initial invalidation so the table reflects "fix in progress" rows;
			// the polling status query keeps the cache in sync as the fixer
			// runs on WPCOM's side.
			queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } );
		},
	} );
}
