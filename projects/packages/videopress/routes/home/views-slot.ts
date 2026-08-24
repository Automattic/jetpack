/*
 * The honesty rules for the Home screen's per-video "how is this doing?" slot.
 *
 * Home deliberately ships no KPI tiles: a brand-new site's stats are all zeros,
 * and a first-run dashboard led by three zeroes is precisely the criticism this
 * screen exists to answer. What each recent-video card gets instead is a single
 * slot that either shows a real views figure or shows an action — never a
 * fabricated `0 views`.
 *
 * Three outcomes, because there are genuinely three situations:
 *
 * - `views`    — stats loaded and this video has recorded plays. Show the number.
 * - `no-plays` — stats loaded and this video provably has none. Say so, and
 *                offer the action that might change it (copy the link).
 * - `unknown`  — we do not know. Either the stats request failed / has no data
 *                behind it (the local dev case, and any wpcom proxy outage), or
 *                the video is missing from a list that was truncated before we
 *                could rule it out. Claim nothing; render the action alone.
 *
 * Kept pure and separate from the stage so the rule is unit-testable without a
 * React tree or a live wpcom proxy — the branch that matters most (`unknown`)
 * is the one that cannot be exercised locally through the UI.
 */

export type ViewsSlot = 'views' | 'no-plays' | 'unknown';

/**
 * Decide what a recent-video card's views slot may claim.
 *
 * Mirrors the `isError && ! hasData` discipline on the Analytics screen
 * (`routes/overview/stage.tsx`): a failed request must never be rendered as a
 * zero, because a zero is a factual claim about the video.
 *
 * @param input                  - Inputs.
 * @param input.statsAvailable   - Whether the stats query has real data behind it (`hasData && ! isError`-equivalent).
 * @param input.views            - Views recorded for this video, or undefined when it is absent from the ranking.
 * @param input.rankingTruncated - Whether the ranking hit its cap, so absence from it proves nothing.
 * @return Which treatment the slot should render.
 */
export function resolveViewsSlot( {
	statsAvailable,
	views,
	rankingTruncated,
}: {
	statsAvailable: boolean;
	views?: number;
	rankingTruncated: boolean;
} ): ViewsSlot {
	if ( ! statsAvailable ) {
		return 'unknown';
	}

	if ( views !== undefined ) {
		// A listed video with a non-positive count is a real, reported zero.
		return views > 0 ? 'views' : 'no-plays';
	}

	// Absent from the ranking. That only means "no plays" when the ranking was
	// short enough to have had room for it.
	return rankingTruncated ? 'unknown' : 'no-plays';
}
