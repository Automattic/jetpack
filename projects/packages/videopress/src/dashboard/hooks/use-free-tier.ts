import { useMockLibrary } from './use-mock-library';

export type FreeTierState = {
	isFree: boolean;
	isAtomic: boolean;
	isUnlimited: boolean;
	videoCount: number;
	limit: number;
	isAtLimit: boolean;
};

const FREE_TIER_UPLOAD_LIMIT = 1;

type Override = boolean | null;

/**
 * Parse a `?vp_free=…` / `?vp_at_limit=…`-style query param into a
 * tri-state override: `true` when present and truthy, `false` when
 * present and falsy, `null` when absent.
 *
 * Designer/QA toggles are read once on first call and frozen. They are
 * deliberately non-reactive because they require a full page reload to
 * change in practice; this keeps the swap to a TanStack Query hook
 * (Phase 6/8) a no-op at the call sites.
 *
 * @param search - The query string (with or without leading `?`).
 * @param key    - Param name to read.
 * @return The override, or `null` when absent.
 */
function parseOverride( search: string, key: string ): Override {
	const params = new URLSearchParams( search );
	if ( ! params.has( key ) ) {
		return null;
	}
	const raw = params.get( key );
	if ( raw === null ) {
		return null;
	}
	const normalized = raw.toLowerCase();
	return ! ( normalized === '0' || normalized === 'false' || normalized === '' );
}

const SEARCH = typeof window === 'undefined' ? '' : window.location.search;
const FREE_OVERRIDE: Override = parseOverride( SEARCH, 'vp_free' );
const AT_LIMIT_OVERRIDE: Override = parseOverride( SEARCH, 'vp_at_limit' );

/**
 * Read `hasVideoPressAccess` from the inlined initial state. Returns
 * `false` (i.e., free tier) when the global is missing — matches the
 * legacy dashboard's behavior of treating unknown plan state as "no
 * paid access".
 *
 * @return Whether the site has a paid VideoPress plan.
 */
function readHasAccess(): boolean {
	if ( typeof JPVIDEOPRESS_INITIAL_STATE === 'undefined' ) {
		return false;
	}
	return Boolean( JPVIDEOPRESS_INITIAL_STATE?.siteData?.hasVideoPressAccess );
}

/**
 * Single source of truth for free-tier state across the modernized
 * VideoPress dashboard. Returns the same shape Phase 6/8 will return
 * from a TanStack Query hook — call sites swap mock for real with no
 * structural change.
 *
 * The legacy `VideoStorageMeter` hides on Atomic and unlimited plans;
 * those signals aren't wired through the modernized initial-state
 * payload yet, so this PR hard-codes them to `false`. Phase 6 replaces
 * those hard-codes with the corresponding settings/features hooks.
 *
 * @return Free-tier state for the page session.
 */
export function useFreeTier(): FreeTierState {
	const { items } = useMockLibrary();
	const isFree = FREE_OVERRIDE !== null ? FREE_OVERRIDE : ! readHasAccess();
	// Mock-library items are all "completed", so `items.length` matches
	// the legacy `uploadedVideoCount` semantics here. The Phase 6/8 swap
	// must filter the real query result to completed uploads (exclude
	// in-progress and failed) before assigning to `videoCount`.
	const realVideoCount = items.length;
	const videoCount = AT_LIMIT_OVERRIDE === true ? FREE_TIER_UPLOAD_LIMIT : realVideoCount;
	const isAtLimit = isFree && videoCount >= FREE_TIER_UPLOAD_LIMIT;
	return {
		isFree,
		isAtomic: false,
		isUnlimited: false,
		videoCount,
		limit: FREE_TIER_UPLOAD_LIMIT,
		isAtLimit,
	};
}
