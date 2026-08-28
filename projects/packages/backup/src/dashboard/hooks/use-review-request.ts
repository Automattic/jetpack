import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { fetchRecentRestores } from '../data/api/restore';
import {
	dismissReviewRequest,
	fetchReviewDismissed,
	type ReviewReason,
} from '../data/api/review-request';
import { keys } from '../data/query-client';
import { isUsableBackup, useBackups } from './use-backups';
import { useCapabilities } from './use-capabilities';
import { useCanQueryWpcom } from './use-connection';
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
 * The age is measured against the browser's clock, which is the only
 * clock this side of the wire has. A machine set minutes fast or slow
 * shifts the boundary by minutes; nothing here is precise enough for
 * that to matter, and there is no cheap server-side alternative. Note
 * this is the one comparison in the restores data that *does* use the
 * local clock — `pickLiveRestore` deliberately does not, because there a
 * skewed clock loses a running restore.
 *
 * An unparseable timestamp answers false. Legacy reached the same
 * conclusion by accident (`NaN < 15` is false); here it is deliberate,
 * and it is the fail-closed direction.
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

	const when = Date.parse( newest.when );
	if ( Number.isNaN( when ) ) {
		return false;
	}

	return ( Date.now() - when ) / MS_PER_DAY < RECENT_RESTORE_MAX_AGE_DAYS;
}

/**
 * Whether the site's last five backups all produced a usable restore point.
 *
 * The predicate is `isUsableBackup`, the same one the rest of the
 * dashboard decides "is this backup any good" with, rather than a second
 * reading written here. That is a deliberate difference from legacy,
 * whose review trigger checked status and stats but not `discarded` —
 * even though legacy's own definition of a good backup does. A site whose
 * oldest backups are being aged out is now told so on this very screen,
 * and asking that reader whether they enjoy the peace of mind would put
 * two contradictory messages side by side.
 *
 * The length check is not redundant: `[].every()` is true, so a site with
 * three good backups would otherwise qualify on a run of five.
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
 * Restore wins when both apply, as in legacy. It is the more specific
 * thing to have just happened, and the reader who restored a site
 * remembers doing it.
 *
 * Both triggers ask the same question in two ways: has the product
 * visibly worked for you? That principle matters more than the numbers.
 * The run-of-five rule replaced a "you have been subscribed for 90 days"
 * test in 2022, moving deliberately from tenure to demonstrated value; a
 * future revision should keep that and is free to change 15 and 5.
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
	/** Record the reader's refusal. A no-op when there is no prompt. */
	dismiss: () => void;
};

/**
 * Everything the review prompt needs to decide whether to appear.
 *
 * Three things have to line up, and the order matters because each is
 * cheaper than the next.
 *
 * **The plugin gate.** The card asks the reader to review the standalone
 * Jetpack VaultPress Backup plugin, so it must not render on a site that
 * does not have it — which a Backup page inside the Jetpack plugin will
 * be. The answer comes from the server on the capabilities response the
 * dashboard has already read by the time this mounts, so it costs
 * nothing and cannot be bypassed from here. See `Capabilities_Bridge`.
 *
 * **The triggers.** See `pickReviewReason`.
 *
 * **The dismissal**, which is per reason. Declining after a restore
 * leaves the backups prompt available, because they are two different
 * questions and the server stores them under two different options.
 *
 * Everything unknown reads as "do not prompt". A pending or failed
 * capabilities read, a pending or failed dismissal read, and a restores
 * read still in flight all keep the card off screen. The cost of that is
 * a card that appears a moment late; the cost of the other direction is
 * asking someone who already said no.
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
	const gateOpen = capabilities?.isStandalonePluginActive === true;

	const restores = useQuery( {
		queryKey: keys.recentRestores(),
		queryFn: fetchRecentRestores,
		enabled: gateOpen,
	} );

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
	const { mutate } = useMutation( {
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
		if ( candidate === null ) {
			return;
		}
		mutate( candidate );
	}, [ candidate, mutate ] );

	// `undefined` covers both "still asking" and "the ask failed", and both
	// mean the same thing here: we cannot confirm this reader has not
	// already declined, so we do not ask them again.
	const isDismissed = dismissal.data ?? true;

	return {
		reason: candidate !== null && ! isDismissed ? candidate : null,
		dismiss,
	};
}
