import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { parseRestoreWhen } from '../data/api/restore';
import {
	dismissReviewRequest,
	fetchReviewDismissed,
	type ReviewReason,
} from '../data/api/review-request';
import { keys } from '../data/query-client';
import { isUsableBackup, useBackups } from './use-backups';
import { useCapabilities } from './use-capabilities';
import { useCanQueryWpcom } from './use-connection';
import { useRecentRestores } from './use-recent-restores';
import type { RecentRestore } from '../data/api/restore';
import type { Backup } from '../types/backup';

/** How recent a restore has to be for the reader to still remember it. */
export const RECENT_RESTORE_MAX_AGE_DAYS = 15;

/** How long a run of good backups counts as the product having worked. */
export const REVIEWABLE_BACKUP_RUN = 5;

const MS_PER_DAY = 86_400_000;

/**
 * Whether the site's last restore worked and is recent enough to ask about.
 *
 * Measured against the browser clock — minutes of skew do not matter here,
 * unlike in `pickLiveRestore`, which avoids it because skew loses a running
 * restore. An unparseable timestamp answers false, the fail-closed direction.
 *
 * @param restores - The restores collection, newest first, or null when the read failed.
 * @return True when the newest restore succeeded within the window.
 */
export function hasRecentSuccessfulRestore(
	restores: RecentRestore[] | null | undefined
): boolean {
	// Index 0 rather than a scan for the newest, which is the legacy
	// reading and the one this ports. WordPress.com returns the collection
	// newest-first; `fetchRecentRestores` only ever drops rows, so it
	// cannot reorder them.
	const newest = restores?.[ 0 ];
	if ( ! newest?.succeeded ) {
		return false;
	}

	const when = parseRestoreWhen( newest.when );
	if ( when === null ) {
		return false;
	}

	return ( Date.now() - when ) / MS_PER_DAY < RECENT_RESTORE_MAX_AGE_DAYS;
}

/**
 * Whether the site's last five backups all produced a usable restore point.
 *
 * Uses `isUsableBackup` rather than legacy's own reading, which ignored
 * `discarded` — so a site being told its backups are aging out is no longer
 * also asked about its peace of mind. The length check is not redundant:
 * `[].every()` is true.
 *
 * @param backups - Normalized backups, newest first.
 * @return True when the newest five are all usable.
 */
export function hasReviewableBackupRun( backups: Backup[] ): boolean {
	return (
		backups.length >= REVIEWABLE_BACKUP_RUN &&
		backups.slice( 0, REVIEWABLE_BACKUP_RUN ).every( isUsableBackup )
	);
}

/**
 * Which review prompt this site has earned, if any.
 *
 * Restore wins when both apply, as in legacy — it is the more specific thing to
 * have just happened. Both triggers ask whether the product has visibly worked;
 * the 15 and 5 are tuning, that principle is not.
 *
 * @param restores - The restores collection, or null/undefined when unread.
 * @param backups  - Normalized backups, newest first.
 * @return The reason to prompt, or null.
 */
export function pickReviewReason(
	restores: RecentRestore[] | null | undefined,
	backups: Backup[]
): ReviewReason | null {
	if ( hasRecentSuccessfulRestore( restores ) ) {
		return 'restore';
	}

	if ( hasReviewableBackupRun( backups ) ) {
		return 'backups';
	}

	return null;
}

type Result = {
	/**
	 * The prompt to show, or null when there is nothing to ask.
	 *
	 * Already accounts for everything: the plugin gate, both triggers, and
	 * whether this reader has dismissed this prompt before. A caller that
	 * renders whenever this is non-null cannot get the order wrong.
	 */
	reason: ReviewReason | null;
	/**
	 * Record the reader's refusal. A no-op when there is no prompt, and
	 * while a previous refusal is still being written.
	 */
	dismiss: () => void;
	/**
	 * True while a dismissal write is in flight.
	 *
	 * Exposed because the card stays on screen until the server confirms,
	 * which also leaves its button live — so the caller has to be able to
	 * tell the reader that the first click was heard. See `dismiss`.
	 */
	isDismissing: boolean;
};

/**
 * Everything the review prompt needs to decide whether to appear.
 *
 * Three gates, cheapest first: the standalone-plugin flag the capabilities
 * response already carries, then `pickReviewReason`, then the dismissal for the
 * winning reason only — so declining one trigger silences the other, as in
 * legacy. Anything unknown or still in flight reads as "do not prompt".
 *
 * @return The prompt to show and the way to decline it.
 */
export function useReviewRequest(): Result {
	const canQueryWpcom = useCanQueryWpcom();
	// Same query key and same `enabled` as `useGateState`, so this is a
	// cache read rather than a second request. This hook only ever runs
	// below `<Gates>`, which does not render a body until that read has
	// resolved.
	const { data: capabilities } = useCapabilities( { enabled: canQueryWpcom } );
	const gateOpen = capabilities?.local?.isStandalonePluginActive === true;

	const restores = useRecentRestores( gateOpen );

	// Already on screen: the Overview screen reads the same query, so this
	// subscribes to a resolved cache entry rather than issuing a request.
	const { backups } = useBackups();

	// Held until the restores read has settled, either way. Restore beats
	// backups, so a `backups` verdict reached while that read is still in
	// flight can be overturned a moment later — which would swap the
	// question under the reader and spend a dismissal round trip on a
	// prompt that was never shown.
	const restoresSettled = restores.isSuccess || restores.isError;
	const candidate = gateOpen && restoresSettled ? pickReviewReason( restores.data, backups ) : null;

	const dismissal = useQuery( {
		// Never null: `enabled` keeps the placeholder from being fetched,
		// and a stable key shape keeps the cache honest.
		queryKey: keys.reviewDismissal( candidate ?? 'none' ),
		queryFn: () => fetchReviewDismissed( candidate as ReviewReason ),
		enabled: candidate !== null,
		// The answer cannot change except through the mutation below, which
		// writes it into the cache itself. Without this, navigating away and
		// back re-asks a question already answered.
		staleTime: Infinity,
	} );

	const queryClient = useQueryClient();
	const { mutate, isPending: isDismissing } = useMutation( {
		mutationFn: ( reason: ReviewReason ) => dismissReviewRequest( reason ),
		// Only on success, which is the point. The legacy dashboard hid the
		// card as soon as the request was sent, so a failed write took the
		// prompt off screen while the server recorded nothing and it
		// returned on the next load. Here a failed write leaves the card up,
		// and clicking again retries it.
		onSuccess: ( _data, reason ) => {
			queryClient.setQueryData( keys.reviewDismissal( reason ), true );
		},
	} );

	const dismiss = useCallback( () => {
		// Refuse a second write while the first is still going. Fixing
		// legacy's unconfirmed dismissal means the card no longer vanishes
		// on click, so on a slow connection nothing visibly happens and the
		// reader clicks again. This is the write half only — what keeps
		// Tracks from hearing one refusal twice is the caller's latch.
		if ( candidate === null || isDismissing ) {
			return;
		}
		mutate( candidate );
	}, [ candidate, isDismissing, mutate ] );

	// `undefined` covers both "still asking" and "the ask failed", and both
	// mean the same thing here: we cannot confirm this reader has not
	// already declined, so we do not ask them again.
	const isDismissed = dismissal.data ?? true;

	return {
		reason: candidate !== null && ! isDismissed ? candidate : null,
		dismiss,
		isDismissing,
	};
}
