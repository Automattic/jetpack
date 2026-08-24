import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { fetchBackups, type RawBackupEntry } from '../data/api/backups';
import { normalizeBackups } from '../data/normalize/backups';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
import { useStickyError } from './use-sticky-error';
import type { Backup, BackupsState } from '../types/backup';

/**
 * How often to re-read the backup list while something is expected to
 * change.
 *
 * The legacy dashboard polls every second. Every tick is a full WPCOM
 * round-trip through the Jetpack proxy, sustained for the entire length
 * of a backup and multiplied by every open tab, so this port backs off
 * to five seconds — still live enough for a progress bar that moves in
 * whole percent.
 */
export const BACKUPS_POLL_INTERVAL_MS = 5000;

/** WPCOM's retryable-failure statuses share this suffix. */
const WILL_RETRY_SUFFIX = '-will-retry';

export type BackupsSummary = {
	state: BackupsState;
	/**
	 * Completion of the running backup, 0–100. Only meaningful while
	 * `state` is `in-progress`; 0 otherwise.
	 */
	progress: number;
	/**
	 * Whether the site is still waiting for its very first usable
	 * restore point. Drives first-run copy.
	 */
	isInitialBackup: boolean;
};

/**
 * Whether a status means "this attempt failed, WPCOM will try again".
 *
 * Matched on the suffix rather than against `error-will-retry` alone:
 * WPCOM ships a family of `<reason>-will-retry` statuses, and the legacy
 * client's exact-equality check silently misses every member but one.
 *
 * @param status - Raw status string.
 * @return True for any retryable-failure status.
 */
export function isWillRetryStatus( status: string ): boolean {
	return status.endsWith( WILL_RETRY_SUFFIX );
}

/**
 * Whether a backup can actually be restored from.
 *
 * All three conditions matter: an unfinished attempt has no restore
 * point, a finished one with empty `stats` is a WPCOM bookkeeping row
 * rather than a real backup, and a discarded one has aged out of the
 * retention window.
 *
 * @param backup - Normalized backup.
 * @return True when the backup is a usable restore point.
 */
export function isUsableBackup( backup: Backup ): boolean {
	return backup.status === 'finished' && backup.hasStats && ! backup.isDiscarded;
}

/**
 * Clamp WPCOM's reported percentage into the range a progress bar can use.
 *
 * @param percent - Normalized percentage.
 * @return An integer in [0, 100].
 */
function clampPercent( percent: number ): number {
	return Math.min( 100, Math.max( 0, Math.round( percent ) ) );
}

/**
 * Reduce the backup list to the single state the dashboard renders.
 *
 * Ported from the legacy `useBackupsState`, with three deliberate
 * differences.
 *
 * A site with no records at all reports `isInitialBackup: true`. The
 * legacy hook only ever sets that flag inside the branch that requires
 * at least one record, so the emptiest possible site — the literal first
 * run — is the one case that gets the generic "Your backup will be ready
 * soon" copy instead of the first-backup copy.
 *
 * Retryable failures are recognized however many records exist. The
 * legacy check is `backups.length === 1 && …`, so a second failed
 * attempt makes the state vanish.
 *
 * A running backup no longer erases a completed one. The legacy hook
 * reassigns its `latestBackup` to the in-flight record, which drops the
 * stats and timestamp of the good backup that already exists; here the
 * two facts are reported side by side via `isInitialBackup`.
 *
 * @param backups - Normalized backups, newest first, scan rows removed.
 * @return The derived state.
 */
export function summarizeBackups( backups: Backup[] ): BackupsSummary {
	if ( backups.length === 0 ) {
		return { state: 'no-backups', progress: 0, isInitialBackup: true };
	}

	// WPCOM returns newest first, and only the newest attempt can be running.
	const newest = backups[ 0 ];
	const hasUsableBackup = backups.some( isUsableBackup );

	if ( newest.status === 'started' ) {
		return {
			state: 'in-progress',
			progress: clampPercent( newest.percent ),
			isInitialBackup: ! hasUsableBackup,
		};
	}

	// Only report a retry while there is nothing good to fall back on.
	// A site with restore points and one failed attempt behind it is
	// still, from the user's point of view, backed up.
	if ( ! hasUsableBackup && isWillRetryStatus( newest.status ) ) {
		return { state: 'will-retry', progress: 0, isInitialBackup: true };
	}

	if ( hasUsableBackup ) {
		return { state: 'complete', progress: 0, isInitialBackup: false };
	}

	return { state: 'no-good-backups', progress: 0, isInitialBackup: true };
}

/**
 * Whether the list is worth re-reading on a timer.
 *
 * @param data      - Whatever the query currently holds.
 * @param forcePoll - Caller override, used right after enqueuing a backup.
 * @return The poll interval in ms, or false to stop polling.
 */
function pollInterval(
	data: RawBackupEntry[] | null | undefined,
	forcePoll: boolean
): number | false {
	if ( forcePoll ) {
		return BACKUPS_POLL_INTERVAL_MS;
	}
	if ( ! Array.isArray( data ) ) {
		// Nothing loaded, or WPCOM could not be read. Retrying on a timer
		// would hammer a failing upstream, so wait to be asked.
		return false;
	}
	const { state } = summarizeBackups( normalizeBackups( data ) );
	return state === 'no-backups' || state === 'in-progress' ? BACKUPS_POLL_INTERVAL_MS : false;
}

type Args = {
	/**
	 * Keep polling regardless of the derived state. Used between
	 * enqueuing a backup and WPCOM publishing a record for it, a window
	 * in which nothing in the response says "something is coming".
	 */
	forcePoll?: boolean;
};

type Result = BackupsSummary & {
	backups: Backup[];
	/**
	 * The query's own failure. Note that the most common failure mode of
	 * this route does *not* populate it: a non-200 from WPCOM is served
	 * as HTTP 200 with a `null` body, which resolves. Branch on
	 * `state === 'error'`, which covers both.
	 */
	error: Error | null;
	/**
	 * Whether a *re*fetch is in flight — a manual retry or a poll tick,
	 * but never the first load. Distinct from the `loading` state: a query
	 * that already resolved is never pending again, so refetching after a
	 * failure leaves every loading-shaped flag false for the whole round
	 * trip, and a retry control driven by them never changes.
	 */
	isRefetching: boolean;
	refetch: () => void;
};

/**
 * React Query hook exposing the site's backup state.
 *
 * Reads `GET /jetpack/v4/backups`, which is registered unconditionally
 * and signed with the blog token, so unlike the modernized bridges it
 * needs no new PHP.
 *
 * That route would in fact answer without a user-level WPCOM connection
 * — its permission callback is a bare `manage_options` check. The query
 * is gated on one anyway, because every screen that reads this hook sits
 * behind `<Gates>`, which blocks the page for those users regardless:
 * issuing the request would only spend a round trip on a page nobody is
 * going to see. The looser route is a property worth knowing about if a
 * future caller does need to read backups outside the gate.
 *
 * @param args           - Hook args.
 * @param args.forcePoll - Poll regardless of derived state.
 * @return The derived state plus the normalized list.
 */
export function useBackups( { forcePoll = false }: Args = {} ): Result {
	const enabled = useCanQueryWpcom();
	const queryClient = useQueryClient();
	const query = useQuery( {
		queryKey: keys.backups(),
		queryFn: fetchBackups,
		enabled,
		refetchInterval: ( { state } ) => pollInterval( state.data, forcePoll ),
	} );

	const { data, refetch } = query;
	// Held across the retry: React Query rewinds this query to `pending`
	// when it refetches after a *rejection*, so without this both `error`
	// and the derived `'error'` state evaporate the moment the reader
	// clicks the retry button — taking the only control that can ask
	// again with them. The route's other failure mode, a `null` body
	// served as HTTP 200, resolves and so is unaffected.
	const error = useStickyError( query.error, query.isFetching );

	const backups = useMemo(
		() => normalizeBackups( Array.isArray( data ) ? data : undefined ),
		[ data ]
	);

	const summary = useMemo< BackupsSummary >( () => {
		// `undefined` is "not asked yet" — either the first request is in
		// flight or the query is disabled because the site has no
		// user-level connection. `null` is "asked, and WPCOM could not
		// answer", which must never be mistaken for an empty site.
		if ( data === undefined ) {
			return {
				state: error ? 'error' : 'loading',
				progress: 0,
				isInitialBackup: false,
			};
		}
		if ( ! Array.isArray( data ) ) {
			return { state: 'error', progress: 0, isInitialBackup: false };
		}
		return summarizeBackups( backups );
	}, [ data, error, backups ] );

	// The activity log has no poll of its own (see query-client.ts's key
	// split), so a backup that finishes while the page is open never
	// shows up there on its own. Fire the invalidation on the
	// `in-progress` -> anything-else edge, not on every poll tick or on
	// mount, or a long-open tab would re-fetch the activity log every
	// 5 seconds for nothing.
	const wasInProgress = useRef( false );
	useEffect( () => {
		if ( wasInProgress.current && summary.state !== 'in-progress' ) {
			queryClient.invalidateQueries( { queryKey: keys.activityLogRoot() } );
		}
		wasInProgress.current = summary.state === 'in-progress';
	}, [ summary.state, queryClient ] );

	// Wrapped so callers can hand it straight to `onClick` without
	// returning a floating promise from the event handler.
	const retry = useCallback( () => {
		refetch();
	}, [ refetch ] );

	return {
		...summary,
		backups,
		error,
		// Not `query.isRefetching`: that is `isFetching && ! isPending`,
		// and the rewind above makes a retry pending again, so it stays
		// false for the whole round trip — the hole this field's docblock
		// describes, in the field meant to close it. "Something is already
		// on screen and we are fetching" is the honest test.
		isRefetching: query.isFetching && ( error !== null || data !== undefined ),
		refetch: retry,
	};
}
