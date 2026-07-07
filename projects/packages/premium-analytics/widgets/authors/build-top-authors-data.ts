/**
 * External dependencies
 */
import {
	calculateDelta,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsTopAuthorsComparisonItem } from '@jetpack-premium-analytics/data';

// The Stats sanitizer substitutes this untranslated sentinel for authors with
// no name (see `sanitizeStatsTopAuthorsResponse`), so match it here to surface a
// localized label.
const UNTRACKED_AUTHORS_SENTINEL = 'Untracked Authors';

/**
 * Resolve a display label for an author, translating the untracked-authors
 * sentinel (and any empty label) into a localized string.
 *
 * @param author - The top-authors item.
 * @return The author's display label.
 */
function getAuthorLabel( author: StatsTopAuthorsComparisonItem ) {
	const label = typeof author.label === 'string' ? author.label : '';

	if ( ! label || label === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics' );
	}

	return label;
}

export type TopAuthorsDataResult = {
	data: LeaderboardChartData;
	hasComparison: boolean;
};

/**
 * Builds leaderboard chart data for the Authors widget.
 *
 * Transforms already-merged Jetpack Stats top-authors rows into the format
 * required by LeaderboardChart.
 *
 * @param authors - Merged top-authors rows from the Stats data layer.
 * @return Processed data ready for the LeaderboardChart component
 */
export function buildTopAuthorsData(
	authors: StatsTopAuthorsComparisonItem[] = []
): LeaderboardChartData {
	return buildTopAuthorsDataWithComparison( authors ).data;
}

/**
 * Builds leaderboard chart data and reports whether any visible author has
 * comparison-period data.
 *
 * @param authors - Merged top-authors rows from the Stats data layer.
 * @return Processed data and row-overlap comparison state.
 */
export function buildTopAuthorsDataWithComparison(
	authors: StatsTopAuthorsComparisonItem[] = []
): TopAuthorsDataResult {
	if ( authors.length === 0 ) {
		return { data: [], hasComparison: false };
	}

	const rows = authors.map( author => ( {
		id: getAuthorLabel( author ),
		label: getAuthorLabel( author ),
		currentValue: author.views,
		previousValue: author.previousViews,
	} ) );
	const hasComparison = rows.some( author => author.previousValue !== undefined );

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...rows.map( author => Math.max( author.currentValue, author.previousValue ?? 0 ) ),
		1
	);

	return {
		data: rows.map( author => ( {
			...author,
			currentShare: ( author.currentValue / maxValue ) * 100,
			previousShare:
				author.previousValue !== undefined ? ( author.previousValue / maxValue ) * 100 : undefined,
			delta:
				author.previousValue !== undefined
					? calculateDelta( author.currentValue, author.previousValue )
					: undefined,
		} ) ),
		hasComparison,
	};
}
