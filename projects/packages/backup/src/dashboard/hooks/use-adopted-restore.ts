import { useQuery } from '@tanstack/react-query';
import { useMemo } from '@wordpress/element';
import { fetchRecentRestores, fetchRestoreStatus, pickLiveRestore } from '../data/api/restore';
import { keys } from '../data/query-client';

export type AdoptedRestore = {
	id: number;
	rewindId: string;
};

type Result = {
	/** The restore already under way, once one has been confirmed. */
	adopted: AdoptedRestore | null;
	/** True while the answer is still unknown. */
	isChecking: boolean;
};

/**
 * Find the restore this site already has running, if any.
 *
 * Every piece of restore state used to live in `useState`, so nothing
 * survived a page load: reloading mid-restore, opening the screen in a
 * second tab, or arriving after a restore started from Calypso all left
 * an armed **Confirm restore** button on screen. Following the only
 * control there would have started a second concurrent whole-site
 * restore, and nothing upstream is known to refuse that.
 *
 * Two reads, in order, because they answer different questions.
 *
 * `GET /jetpack/v4/restores` says what exists. It is signed with the blog
 * token, so it answers for any admin rather than only the one who started
 * the restore — which is what makes a second tab, or a second person,
 * work at all.
 *
 * Its rows carry a status in a vocabulary that is not ours, so a row we
 * cannot read as settled is only a *candidate*. The status route decides,
 * because it speaks the vocabulary the bridge maps. That costs a second
 * request only when there is something plausible to confirm: a site whose
 * last restore finished — the overwhelmingly common case — is answered by
 * the first read alone.
 *
 * Until both have answered, `isChecking` is true and the caller must show
 * neither the form nor a progress bar. Arming first and correcting later
 * would put a live Confirm button on screen for exactly as long as the
 * lookup takes, which is the failure this exists to remove.
 *
 * @param enabled - False once this screen has a submission of its own, which makes the lookup moot.
 * @return The adopted restore, and whether the answer is still pending.
 */
export function useAdoptedRestore( enabled: boolean ): Result {
	const collection = useQuery( {
		queryKey: keys.recentRestores(),
		queryFn: fetchRecentRestores,
		enabled,
	} );

	// Any backup, not just this screen's: a restore of a different point
	// overwrites the same live site, so a second one is wrong whichever
	// point it came from.
	const candidate = useMemo(
		() => ( enabled ? pickLiveRestore( collection.data ?? null, null ) : null ),
		[ enabled, collection.data ]
	);

	// Always-defined key so @tanstack/query/exhaustive-deps stays happy;
	// `enabled` keeps the placeholder from firing. The key is shared with
	// the caller's own status poll, so confirming does not cost a request
	// the poll would have made anyway.
	const candidateId = candidate?.restore_id ?? -1;
	const confirmation = useQuery( {
		queryKey: keys.restoreStatus( candidateId ),
		queryFn: () => fetchRestoreStatus( candidateId ),
		// `enabled` as well as the candidate: the two derive from the same
		// render, and gating on the candidate alone left a single-render
		// window in which a caller that had just submitted still fired a
		// confirmation for a restore it was no longer interested in.
		enabled: enabled && candidate !== null,
	} );

	const isChecking =
		enabled && ( collection.isPending || ( candidate !== null && confirmation.isPending ) );

	// Positive evidence only, and deliberately stricter than the poll's
	// own `! isTerminal(…)`.
	//
	// That test counts `queued` as live, and `queued` is exactly what the
	// bridge mints for a **404** — "that restore is not visible to this
	// route" — so it reads absence of evidence as evidence of life. For a
	// restore we are *watching*, erring that way is right: keep polling.
	// For one we are deciding whether to adopt, it is backwards. A
	// collection row spelled in a way we do not recognise as settled,
	// pointing at a restore upstream cannot find, would take the form
	// away and never give it back — and the adoption is what withholds
	// the button that would have replaced it, so it cannot self-correct.
	//
	// The cost of being strict is a missed adoption, which is what this
	// hook already accepts for a confirmation that fails to arrive.
	const isLive = confirmation.data?.status === 'running';

	return {
		adopted:
			candidate !== null && isLive
				? { id: candidate.restore_id, rewindId: candidate.rewind_id }
				: null,
		isChecking,
	};
}
