import { getScriptData } from '@automattic/jetpack-script-data';
import { useMemo } from '@wordpress/element';
import { useLibrary } from './use-library';
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

// Both flags are per-site *and* per-user: two accounts sharing a browser, or
// one account across two sites, must not inherit each other's first run.
const ONBOARDING_SEEN_KEY_PREFIX = 'jetpack-videopress-onboarding-seen';
const FIRST_PUBLISH_KEY_PREFIX = 'jetpack-videopress-first-publish';

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
 * flow's publish step, so first-run never comes back after an activation.
 */
export function markFirstPublish(): void {
	writeFlag( FIRST_PUBLISH_KEY_PREFIX );
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

	return {
		videoCount: paginationInfo?.totalItems ?? 0,
		isSettled: ! isLoading,
	};
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
 * The current dashboard shape, from the real library count plus the persisted
 * publish flag.
 *
 * The count reads 0 before its first response, so an unknown/loading library
 * reads as first-run — which keeps the Upload tab visible rather than flashing
 * the returning-user shell at a brand-new user. That optimism is safe for
 * rendering only; see `useSettledFirstRunState` for navigation.
 *
 * The flag is read on every render rather than memoized: `markFirstPublish()`
 * writes it mid-session, and a cached read would leave the dashboard claiming
 * first-run after the user has just activated.
 *
 * @return The dashboard shape to render.
 */
export function useFirstRunState(): FirstRunState {
	const { videoCount } = useLibraryVideoCount();
	const hasPublished = hasPublishedVideo();

	return useMemo(
		() => resolveFirstRunState( { hasPublished, videoCount } ),
		[ hasPublished, videoCount ]
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
