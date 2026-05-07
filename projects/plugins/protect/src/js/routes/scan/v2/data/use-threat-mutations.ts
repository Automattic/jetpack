/**
 * TanStack mutation hooks for the Protect Scan v2 row actions
 * (fix / ignore / unignore) and the manual scan trigger.
 *
 * Each hook calls into a fetcher in `./fetchers` and, on success,
 * invalidates the shared `SCAN_QUERY_PREFIX` so the active +
 * history + counts queries refetch off the latest WPCOM state
 * instead of showing stale rows. Errors propagate untouched —
 * the consumer (Phase 3 modals + Phase 5 ScanStatus) renders the
 * notice / retry UX.
 *
 * Mirrors `projects/packages/scan/src/js/data/use-threat-mutations.ts`
 * deliberately so future phases can port hooks 1:1 from
 * `packages/scan` without translation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enqueueScan, fixThreats, ignoreThreat, unignoreThreat } from './fetchers';
import { SCAN_QUERY_PREFIX } from './query-options';
import type { FixThreatsResponse } from './types';

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
			// the polling status query (`useFixThreatsStatusQuery`) keeps the
			// cache in sync as the fixer runs on WPCOM's side.
			queryClient.invalidateQueries( { queryKey: SCAN_QUERY_PREFIX } );
		},
	} );
}

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
