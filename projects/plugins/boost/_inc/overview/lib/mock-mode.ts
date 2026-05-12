/**
 * Dev-only mock mode for the Overview hooks. Returns canned data — scores
 * with a populated `noBoost` baseline so the deltas render, and a 30-day
 * history with a believable curve — so we can verify the full design
 * without waiting for the speed-score API to populate.
 *
 * Two modes:
 *
 *     localStorage.setItem( 'jetpack_boost_overview_mock', '1' );     // free tier (upgrade overlay)
 *     localStorage.setItem( 'jetpack_boost_overview_mock', 'paid' );  // paid tier (chart populated)
 *
 * Clear with:
 *
 *     localStorage.removeItem( 'jetpack_boost_overview_mock' );
 *
 * This file is intentionally tiny + side-effect-free so PR 4's flip
 * doesn't need to think about it; if it lives long enough to be useful,
 * future PRs can wire it behind a Storybook story or a `?_mock=1` URL
 * param instead of localStorage.
 */
export type MockMode = 'free' | 'paid' | null;

export function getMockMode(): MockMode {
	try {
		if ( typeof window === 'undefined' ) {
			return null;
		}
		const value = window.localStorage?.getItem( 'jetpack_boost_overview_mock' );
		if ( value === 'paid' ) {
			return 'paid';
		}
		if ( value === '1' || value === 'free' ) {
			return 'free';
		}
		return null;
	} catch {
		return null;
	}
}

export function isMockMode(): boolean {
	return getMockMode() !== null;
}

// Diverse-but-believable demo state — Desktop lands in Lighthouse "Good"
// (>= 90), Mobile in "Could be improved" (50-89), both with positive
// deltas vs. the without-Boost baseline so the tier badges and the
// progress bars exercise both colour families in a single screenshot.
export const MOCK_SCORES = {
	current: { mobile: 78, desktop: 92 },
	noBoost: { mobile: 68, desktop: 82 },
	isStale: false,
} as const;

/**
 * Generates a 30-day fixture of performance-history periods anchored to
 * the previous calendar day, so the chart x-axis reads as a recent month.
 * Two interlocking curves: Desktop hovers around 85, Mobile around 75,
 * with a synthetic dip near day 9 to give the line real shape. Used when
 * the dev mock toggle is on so design review can see the chart populated.
 *
 * @return Mock periods + range matching the real endpoint's wire shape.
 */
export function buildMockHistory() {
	const dayMs = 24 * 60 * 60 * 1000;
	const now = Date.now();
	const periods = Array.from( { length: 30 }, ( _, i ) => {
		const timestamp = Math.floor( ( now - ( 29 - i ) * dayMs ) / 1000 );
		const dip = Math.abs( i - 9 ) < 3 ? 12 - Math.abs( i - 9 ) * 3 : 0;
		const trend = Math.sin( i / 6 ) * 4;
		return {
			timestamp,
			dimensions: {
				desktop_overall_score: Math.round( 85 + trend - dip ),
				mobile_overall_score: Math.round( 75 + trend - dip ),
			},
		};
	} );

	return {
		periods,
		startDate: periods[ 0 ].timestamp,
		endDate: periods[ periods.length - 1 ].timestamp,
	};
}

/**
 * Dummy time series for the upgrade overlay. Distinct from
 * `buildMockHistory` so the free-tier preview reads as inspirational —
 * a clearly upward trend that takes a single noticeable dip and recovers,
 * with enough variance that the line keeps the eye moving across the
 * full chart width. Anchored to the previous calendar day so the x-axis
 * still labels recent dates.
 *
 * @return Dummy periods + range matching the real endpoint's wire shape.
 */
export function buildDummyHistory() {
	const dayMs = 24 * 60 * 60 * 1000;
	const now = Date.now();
	const periods = Array.from( { length: 30 }, ( _, i ) => {
		const timestamp = Math.floor( ( now - ( 29 - i ) * dayMs ) / 1000 );
		// Constant upward growth — linear from 60 → 92 (desktop) and
		// 50 → 84 (mobile) across the 30-day window.
		const desktopBase = 60 + ( i / 29 ) * 32;
		const mobileBase = 50 + ( i / 29 ) * 34;
		// Variance so the line doesn't look algorithmic.
		const noise = Math.sin( i * 1.3 ) * 2.5 + Math.cos( i * 0.7 ) * 1.5;
		// A single noticeable dip around day 12 — three-day window so
		// the recovery is visible in the same screenshot.
		const dipDistance = Math.abs( i - 12 );
		const dip = dipDistance < 3 ? ( 3 - dipDistance ) * 6 : 0;
		return {
			timestamp,
			dimensions: {
				desktop_overall_score: Math.round( desktopBase + noise - dip ),
				mobile_overall_score: Math.round( mobileBase + noise - dip ),
			},
		};
	} );

	return {
		periods,
		startDate: periods[ 0 ].timestamp,
		endDate: periods[ periods.length - 1 ].timestamp,
	};
}
