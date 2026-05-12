/**
 * Synthetic 30-day fixture used by the Historical performance chart when
 * the visitor is on a free plan (the `performance_history` module is
 * unavailable and the chart shows an upgrade Notice on top of a blurred
 * curve). Shape is intentional: linear upward growth so the visitor sees
 * an aspirational trend, a believable noise pattern so the line doesn't
 * read as obviously generated, and one noticeable dip with a 3-day
 * recovery so the curve has a story.
 *
 * Anchored to the previous calendar day so the chart's x-axis labels
 * recent dates regardless of when the page is opened.
 *
 * @return Periods + range matching the real endpoint's wire shape.
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
