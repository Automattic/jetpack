import { getScriptData } from '@automattic/jetpack-script-data';
import { useEffect, useMemo } from '@wordpress/element';
import { useLibrary } from './use-library';
import { useOnboardingCounts } from './use-onboarding-counts';
import type { View } from '@wordpress/dataviews';

/**
 * Which shape of the dashboard a user should get.
 *
 * `first-run` is the activation experience: Upload is the whole page, the
 * welcome modal sits over it, and the other tabs follow. `home` is everybody
 * else — anyone with a library, or anyone who has already published, gets the
 * returning-user dashboard.
 *
 * The two flags are deliberately independent. The published flag survives an
 * emptied library, and the library count catches a user whose flag is cold
 * (new browser, cleared storage, a site that had videos before this shipped).
 *
 * TODO(VIDP-###): localStorage is the MVP; this should move to user meta so it
 * survives browsers.
 */
export type FirstRunState = 'first-run' | 'home';

// Every flag here is per-site *and* per-user: two accounts sharing a browser,
// or one account across two sites, must not inherit each other's first run.
const ONBOARDING_SEEN_KEY_PREFIX = 'jetpack-videopress-onboarding-seen';
const FIRST_PUBLISH_KEY_PREFIX = 'jetpack-videopress-first-publish';
const LIBRARY_SEEN_KEY_PREFIX = 'jetpack-videopress-library-seen';

/**
 * Build a per-site/per-user localStorage key.
 *
 * `blog_id` defaults to 0 for disconnected sites (see assets Script_Data), and
 * `??` would treat that 0 as a real id — collapsing every disconnected site in
 * the same browser onto one shared key. Only trust a positive id; otherwise
 * fall back to the host so different sites stay separate.
 *
 * @param prefix - Flag-specific key prefix.
 * @return Storage key scoped to the current site and dashboard user.
 */
export function getScopedStorageKey( prefix: string ): string {
	const data = getScriptData();
	const blogId = data?.site?.wpcom?.blog_id;
	const scope = typeof blogId === 'number' && blogId > 0 ? blogId : data?.site?.host ?? 'site';
	const userId = data?.user?.current_user?.id ?? 'user';

	return `${ prefix }-${ scope }-${ userId }`;
}

/**
 * Read a persisted boolean flag.
 *
 * @param prefix   - Flag-specific key prefix.
 * @param fallback - Value to use when storage is unavailable.
 * @return The stored flag, or `fallback` when it cannot be read.
 */
function readFlag( prefix: string, fallback: boolean ): boolean {
	if ( typeof window === 'undefined' ) {
		return fallback;
	}

	try {
		return window.localStorage.getItem( getScopedStorageKey( prefix ) ) === '1';
	} catch {
		return fallback;
	}
}

/**
 * Write a persisted boolean flag, ignoring unavailable storage.
 *
 * @param prefix - Flag-specific key prefix.
 */
function writeFlag( prefix: string ): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	try {
		window.localStorage.setItem( getScopedStorageKey( prefix ), '1' );
	} catch {
		// Storage can be unavailable in private browsing or due to quota. The
		// caller still behaves correctly for the current session; the flag just
		// won't survive a reload.
	}
}

/**
 * Read the saved onboarding-modal dismissal flag.
 *
 * Defaults to "seen" when storage is unreadable at the SSR boundary so the
 * modal is never rendered without a way to dismiss it.
 *
 * @return True when the user already dismissed the modal.
 */
export function hasSeenOnboarding(): boolean {
	if ( typeof window === 'undefined' ) {
		return true;
	}

	return readFlag( ONBOARDING_SEEN_KEY_PREFIX, false );
}

/**
 * Save the onboarding-modal dismissal flag, ignoring unavailable storage.
 */
export function saveDismissal(): void {
	writeFlag( ONBOARDING_SEEN_KEY_PREFIX );
}

/**
 * Forget the dismissal, so the modal can greet this user again. Used by the
 * `welcome=1` preview param — design review needs to re-see the modal at
 * will, and hand-clearing localStorage is nobody's workflow.
 */
export function clearDismissal(): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	try {
		window.localStorage.removeItem( getScopedStorageKey( ONBOARDING_SEEN_KEY_PREFIX ) );
	} catch {
		// Unavailable storage means there was nothing persisted to clear.
	}
}

/**
 * Read the "this user has published a video" flag.
 *
 * @return True when the user has completed the publish step at least once.
 */
export function hasPublishedVideo(): boolean {
	return readFlag( FIRST_PUBLISH_KEY_PREFIX, false );
}

/**
 * Record that the user has published their first video. Called from the upload
 * flow's publish step, so first-run never comes back after an activation — and
 * from `useObserveFirstRunSignals`, which records the same fact about a user
 * whose VideoPress videos predate this flag existing.
 */
export function markFirstPublish(): void {
	writeFlag( FIRST_PUBLISH_KEY_PREFIX );
}

/**
 * Read the "this user's library has held videos" flag.
 *
 * The other half of the pair above: the publish flag answers "has this person
 * used VideoPress", this one answers "has this person got a library at all" —
 * which is the question the tab order asks, and the only one a site full of
 * local (non-VideoPress) video attachments answers differently.
 *
 * @return True when a settled count has already proved the library non-empty.
 */
export function hasEstablishedLibrary(): boolean {
	return readFlag( LIBRARY_SEEN_KEY_PREFIX, false );
}

/**
 * Record that this user's library holds videos, so later loads know the answer
 * before their count comes back. Like the publish flag it survives an emptied
 * library: deleting everything must not hand somebody a second first run.
 */
export function markEstablishedLibrary(): void {
	writeFlag( LIBRARY_SEEN_KEY_PREFIX );
}

// Counts everything in the library, with no `type` filter. This is the whole
// difference between this view and `useFreeTier`'s: that one deliberately
// counts VideoPress-hosted videos only, because the free-tier upload cap
// applies to those alone. First run is asking a different question — "has this
// person got a library at all" — and reusing the capped count answers it wrong
// on any site holding local video attachments: 27 videos on the site, 0 of
// them VideoPress-hosted, and an established user gets greeted as brand new.
const FIRST_RUN_COUNT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 1,
	fields: [],
	filters: [],
	search: '',
	sort: { field: 'date', direction: 'desc' },
};

/**
 * How many videos the library holds, and whether that number is known yet.
 *
 * @return The total library count, and whether its request has settled.
 */
function useLibraryVideoCount(): { videoCount: number; isSettled: boolean } {
	const { paginationInfo, isLoading } = useLibrary( FIRST_RUN_COUNT_VIEW );

	return { videoCount: paginationInfo?.totalItems ?? 0, isSettled: ! isLoading };
}

/**
 * Write down what this load learned about the user, so the next one starts from
 * an answer instead of a guess. The single observation point for both flags.
 *
 * They used to be written wherever the counts happened to already be on screen:
 * the library flag from the count hook above, the publish flag from an effect
 * inside `OnboardingModal`. Both places are components some routes mount and
 * others don't — `/video/:id` mounts neither — so a returning user who opened a
 * video link in a fresh browser had nothing written down at all. Delete that
 * video and the counts honestly read 0, with no record of what came before, and
 * the first-run welcome modal greeted them over the "Video deleted." notice.
 *
 * Two flags, one writer: they answer different questions and must stay separate
 * keys (see `hasEstablishedLibrary`), but "has this user got a library" and "has
 * this user used VideoPress" are learned from the same pair of settled counts at
 * the same moment, and a load that learns one has learned the other. Mounted
 * from `QueryClientWrapper` — the one wrapper every route stage shares — so
 * every route observes, including the ones with no dashboard chrome.
 *
 * A settled count is the whole precondition. An in-flight count reads 0, which
 * is byte-identical to a genuinely empty library: writing on that would tell
 * every later load that a brand-new user is established. Nothing is ever
 * written from a loading count, and a settled zero writes nothing either — it
 * is the one answer that proves nothing about the next load.
 *
 * The queries are the same ones the dashboard already runs (identical views, so
 * identical react-query keys), which means the tab strip and the welcome modal
 * read a warm cache rather than paying for a second request. On `/video/:id`
 * and the video editor, which asked for none of them, this is genuinely three
 * extra `perPage: 1` count requests — the price of observing everywhere.
 */
export function useObserveFirstRunSignals(): void {
	const { videoCount, isSettled } = useLibraryVideoCount();
	const { videoPressCount, isSettled: areTypeCountsSettled } = useOnboardingCounts();

	useEffect( () => {
		if ( isSettled && videoCount > 0 ) {
			markEstablishedLibrary();
		}
	}, [ isSettled, videoCount ] );

	// A user with a VideoPress-hosted video published one, whether or not they
	// did it in this browser and whether or not this flag existed when they did.
	useEffect( () => {
		if ( areTypeCountsSettled && videoPressCount > 0 ) {
			markFirstPublish();
		}
	}, [ areTypeCountsSettled, videoPressCount ] );
}

/**
 * Resolve the dashboard shape from the two first-run signals.
 *
 * First run is the narrow case: nothing published *and* nothing in the
 * library. An existing user with videos always gets `home`, even with a cold
 * flag — a cleared localStorage must never drop somebody back into onboarding.
 *
 * @param signals              - First-run signals.
 * @param signals.hasPublished - Whether the user has already published a video.
 * @param signals.videoCount   - Total videos in the library, of any type.
 * @return The dashboard shape to render.
 */
export function resolveFirstRunState( {
	hasPublished,
	videoCount,
}: {
	hasPublished: boolean;
	videoCount: number;
} ): FirstRunState {
	return ! hasPublished && videoCount === 0 ? 'first-run' : 'home';
}

/**
 * The current dashboard shape, from what is already known about this user plus
 * the real library count.
 *
 * The count reads 0 before its first response, so an unknown library is
 * byte-identical to an empty one. Rendering has to answer anyway, and it
 * answers `first-run`: that keeps the Upload tab in front of a brand-new user
 * rather than flashing the returning-user shell at them. That optimism is safe
 * for rendering only; see `useSettledFirstRunState` for navigation.
 *
 * But a guess is only acceptable where there is nothing to know. It used to be
 * made on every single load, for everybody — so a returning user watched the
 * strip paint `Upload | Library | …` and rename its first tab to Home a few
 * hundred milliseconds later, on every arrival, forever. Nothing was ever
 * written down: `hasPublishedVideo` is only set by an upload made in THIS
 * browser, so a library that predates the flag (or a cleared localStorage) went
 * on guessing fresh every time. The library flag closes that — the first
 * settled count that proves a non-empty library is remembered, and from then on
 * the shape is derived on the first render of every later load instead of
 * guessed and corrected.
 *
 * A genuine first run has nothing to remember, so it still gets the optimistic
 * order — immediately, and correctly. That is the audience the optimism exists
 * for, and it is untouched.
 *
 * The flags are read on every render rather than memoized: both are written
 * mid-session, and a cached read would leave the dashboard claiming first-run
 * after the user has just activated.
 *
 * @return The dashboard shape to render.
 */
export function useFirstRunState(): FirstRunState {
	const { videoCount } = useLibraryVideoCount();
	const hasPublished = hasPublishedVideo();
	const isEstablished = hasEstablishedLibrary();

	return useMemo(
		() => ( isEstablished ? 'home' : resolveFirstRunState( { hasPublished, videoCount } ) ),
		[ hasPublished, isEstablished, videoCount ]
	);
}

/**
 * The same shape, but honest about not knowing yet.
 *
 * `useFirstRunState()` is deliberately optimistic: a loading library reads as
 * `first-run` so a brand-new user never sees the returning-user shell flash
 * past. That is right for *rendering* — the worst case is a tab strip that
 * settles — and wrong for *navigating*, where acting on the guess sends an
 * existing user with a full library to the empty upload screen. Anything that
 * changes the route must wait for `loading` to clear.
 *
 * @return The dashboard shape, or `loading` while the library count is unknown.
 */
export function useSettledFirstRunState(): FirstRunState | 'loading' {
	const { videoCount, isSettled } = useLibraryVideoCount();
	const hasPublished = hasPublishedVideo();

	return useMemo( () => {
		if ( ! isSettled ) {
			return 'loading';
		}
		return resolveFirstRunState( { hasPublished, videoCount } );
	}, [ hasPublished, isSettled, videoCount ] );
}
