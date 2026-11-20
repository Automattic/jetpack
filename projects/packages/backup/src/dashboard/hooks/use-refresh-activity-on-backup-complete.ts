import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import {
	backupReadyText,
	completedWithWarningsText,
	failedRunText,
	noGoodBackupsText,
	willRetryText,
} from '../components/backup-status/messages';
import { announce } from '../data/announce';
import { keys } from '../data/query-client';
import { isUsableBackup, isWillRetryStatus } from './use-backups';
import type { Backup, BackupsState } from '../types/backup';

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

/** How often to ask for the activity log again, and how long to keep asking. */
const ACTIVITY_RETRY_MS = 3000;
const ACTIVITY_RETRY_CEILING_MS = 60_000;

/** How a watched run failed on a site that kept older restore points, for the Overview's banner. */
export type FailedRun = 'will-retry' | 'failed' | null;

/**
 * Refresh the activity list once a running backup has ended, and announce how it ended.
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
 * @param state                  - The derived backups state, from `useBackups`.
 * @param isRequested            - Whether a "Back up now" request is still pending.
 * @param latestBackupId         - The newest usable backup's id, or null when there is none.
 * @param newest                 - The newest attempt, usable or not, or null when there is none.
 * @param newestActivityBackupId - The activity log's newest backup row, or null when it has none.
 * @return Runs watched to the end, how the last one failed, whether it made a backup the reader has not dismissed, and whether the list still lacks it.
 */
export function useRefreshActivityOnBackupComplete(
	state: BackupsState,
	isRequested: boolean,
	latestBackupId: string | null,
	newest: Backup | null = null,
	newestActivityBackupId: string | null = null
): {
	finishedRuns: number;
	failedRun: FailedRun;
	completedRun: boolean;
	isAwaitingRow: boolean;
	dismissCompletedRun: () => void;
} {
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
	// The newest attempt before the run, so a failure is announced only for an attempt the run made.
	const newestBeforeRun = useRef< string | null >( null );
	const [ finishedRuns, setFinishedRuns ] = useState( 0 );
	const [ failedRun, setFailedRun ] = useState< FailedRun >( null );
	// Set when a run makes a backup; cleared when the reader dismisses it or another run starts or fails.
	const [ completedRun, setCompletedRun ] = useState( false );
	// Set when a run made a backup, until the activity log lists a newer one than `baseline`.
	const [ awaitingRow, setAwaitingRow ] = useState< { baseline: string | null } | null >( null );
	const newestId = newest?.id ?? null;
	const newestHasWarnings = newest?.hasWarnings ?? false;
	const newestFailed = newest !== null && ! isUsableBackup( newest );
	const newestWillRetry = newest !== null && isWillRetryStatus( newest.status );

	useEffect( () => {
		// A pending request counts as a run: a short backup can go from one
		// `complete` to the next without showing `in-progress`.
		if ( state === 'in-progress' || isRequested ) {
			sawInProgress.current = true;
			// Not on the request alone: one that fails before any attempt leaves the last failure standing.
			if ( state === 'in-progress' ) {
				setFailedRun( null );
			}
			setCompletedRun( false );
		} else if ( sawInProgress.current && RUN_ENDED_STATES.includes( state ) ) {
			sawInProgress.current = false;
			setFinishedRuns( count => count + 1 );
			queryClient.invalidateQueries( { queryKey: keys.activityLogRoot() } );
			if ( state === 'complete' && latestBackupId !== lastSeenBackupId.current ) {
				// The run's attempt is the new restore point, so its warnings are this backup's.
				announce(
					newestHasWarnings
						? completedWithWarningsText().replace( /<\/?a>/g, '' )
						: backupReadyText()
				);
				setFailedRun( null );
				setCompletedRun( true );
				setAwaitingRow( { baseline: newestActivityBackupId } );
			} else if ( newestFailed && newestId !== newestBeforeRun.current ) {
				if ( state === 'no-good-backups' ) {
					announce( noGoodBackupsText() );
				} else {
					announce( newestWillRetry ? willRetryText() : failedRunText() );
				}
				// Only `complete` has no banner of its own for this: the others are site states.
				if ( state === 'complete' ) {
					setFailedRun( newestWillRetry ? 'will-retry' : 'failed' );
				}
			}
		}
		// An unreadable list names no backup, and would make the old one look new.
		if ( state !== 'error' && state !== 'loading' ) {
			lastSeenBackupId.current = latestBackupId;
			if ( ! sawInProgress.current ) {
				newestBeforeRun.current = newestId;
			}
		}
	}, [
		state,
		isRequested,
		latestBackupId,
		newestId,
		newestHasWarnings,
		newestFailed,
		newestWillRetry,
		newestActivityBackupId,
		queryClient,
	] );

	// WPCOM lists a finished backup a moment after the backups read reports it, so ask again until the row shows.
	// `cancelRefetch: false`: a slow request must finish, not be cancelled by the next tick.
	useEffect( () => {
		if ( ! awaitingRow ) {
			return;
		}
		if ( newestActivityBackupId !== awaitingRow.baseline ) {
			setAwaitingRow( null );
			return;
		}
		const retry = setInterval(
			() =>
				queryClient.invalidateQueries(
					{ queryKey: keys.activityLogRoot() },
					{ cancelRefetch: false }
				),
			ACTIVITY_RETRY_MS
		);
		const giveUp = setTimeout( () => setAwaitingRow( null ), ACTIVITY_RETRY_CEILING_MS );
		return () => {
			clearInterval( retry );
			clearTimeout( giveUp );
		};
	}, [ awaitingRow, newestActivityBackupId, queryClient ] );

	const dismissCompletedRun = useCallback( () => setCompletedRun( false ), [] );

	return {
		finishedRuns,
		failedRun,
		completedRun,
		isAwaitingRow: awaitingRow !== null,
		dismissCompletedRun,
	};
}
