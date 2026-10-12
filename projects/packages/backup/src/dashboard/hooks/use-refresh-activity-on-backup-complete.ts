import { useQueryClient } from '@tanstack/react-query';
import { speak } from '@wordpress/a11y';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keys } from '../data/query-client';
import type { BackupsState } from '../types/backup';

/**
 * States that mean "the run that was going is over".
 *
 * `error` is deliberately absent. It is not an outcome of the backup but
 * of the *request* — and per `useBackups`, a `/jetpack/v4/backups`
 * answer whose body will not decode is served as HTTP 200 with a `null`
 * body, which lands exactly here. Refetching the activity log on it
 * would aim a round trip at an upstream that just failed, for an answer
 * that cannot contain the finished backup. `loading` is absent for the
 * same reason: nothing has been learned yet.
 */
const RUN_ENDED_STATES: readonly BackupsState[] = [
	'complete',
	'will-retry',
	'no-good-backups',
] as const;

/**
 * Refresh the activity list once a running backup has ended, and announce one that produced
 * a new restore point.
 *
 * The activity-log family has no poll of its own — see the key split in
 * `data/query-client.ts` — so nothing else notices that a new restore
 * point exists, and the row only appears on a reload.
 *
 * Mount this **once per screen**. Every mounted observer would otherwise
 * invalidate on the same edge, and concurrent invalidations do not
 * coalesce: `invalidateQueries` forwards to `refetchQueries`, which
 * defaults `cancelRefetch: true`, so `Query.fetch()` cancels the
 * in-flight refetch and starts another. `apiCall` passes no `signal`, so
 * the cancelled request is not aborted on the wire — it completes and
 * its response is discarded. Two observers therefore cost two WPCOM
 * round trips per finished backup per open tab, not one.
 *
 * @param state          - The derived backups state, from `useBackups`.
 * @param isRequested    - Whether a "Back up now" request is still pending.
 * @param latestBackupId - The newest usable backup's id, or null when there is none.
 * @return How many runs this screen has watched end, for the list's "new" marker.
 */
export function useRefreshActivityOnBackupComplete(
	state: BackupsState,
	isRequested: boolean,
	latestBackupId: string | null
): number {
	const queryClient = useQueryClient();
	// Latched rather than compared against the previous render's state:
	// a single failed poll mid-backup moves the state to `error` and
	// stops the poll, so the run's end is only ever observed on the
	// reader's retry — one transition later. A plain previous-state
	// comparison would have forgotten the run by then and left the list
	// stale, which is the bug this hook exists to fix.
	const sawInProgress = useRef( false );
	// A request that fails or times out also ends a "run", so the announcement needs a new backup.
	const lastSeenBackupId = useRef< string | null >( null );
	const [ finishedRuns, setFinishedRuns ] = useState( 0 );

	useEffect( () => {
		// A pending request counts as a run: a short backup can go from one
		// `complete` to the next without showing `in-progress`.
		if ( state === 'in-progress' || isRequested ) {
			sawInProgress.current = true;
		} else if ( sawInProgress.current && RUN_ENDED_STATES.includes( state ) ) {
			sawInProgress.current = false;
			setFinishedRuns( count => count + 1 );
			queryClient.invalidateQueries( { queryKey: keys.activityLogRoot() } );
			if ( state === 'complete' && latestBackupId !== lastSeenBackupId.current ) {
				speak( __( 'Your backup is ready.', 'jetpack-backup-pkg' ) );
			}
		}
		// An unreadable list names no backup, and would make the old one look new.
		if ( state !== 'error' && state !== 'loading' ) {
			lastSeenBackupId.current = latestBackupId;
		}
	}, [ state, isRequested, latestBackupId, queryClient ] );

	return finishedRuns;
}
