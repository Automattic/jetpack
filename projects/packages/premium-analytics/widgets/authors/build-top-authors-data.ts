/**
 * External dependencies
 */
import {
	calculateDelta,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

type TopAuthorLeaderboardEntry = {
	// Display label, also used as the key to dedup and align primary/comparison
	// periods. The Stats top-authors response exposes no stable author id, so two
	// distinct authors sharing a display name collapse into one row.
	label: string;
	views: number;
};

/**
 * Resolve a display label for an author, falling back to a translated
 * "Untracked authors" label when the API provides none.
 *
 * @param author - The top-authors item.
 * @return The author's display label.
 */
function getAuthorLabel( author: StatsTopAuthorsItem ) {
	return typeof author.label === 'string' && author.label
		? author.label
		: __( 'Untracked authors', 'jetpack-premium-analytics' );
}

/**
 * Aggregate a top-authors report into per-author view totals, keyed by display
 * label, summing across data points and sorting by views descending.
 *
 * @param report - The normalized top-authors report, or undefined while loading.
 * @return The aggregated, sorted author entries.
 */
function summarizeAuthors(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): TopAuthorLeaderboardEntry[] {
	const authorViews = new Map< string, TopAuthorLeaderboardEntry >();

	for ( const dataPoint of report?.data ?? [] ) {
		for ( const author of dataPoint.items ) {
			const label = getAuthorLabel( author );
			const existing = authorViews.get( label );

			authorViews.set( label, {
				label,
				views: ( existing?.views ?? 0 ) + author.views,
			} );
		}
	}

	return Array.from( authorViews.values() ).sort( ( a, b ) => b.views - a.views );
}

/**
 * Builds leaderboard chart data for the Authors widget.
 *
 * Transforms Jetpack Stats top-authors data into the format required by
 * LeaderboardChart, with comparison values aligned by author display label
 * (authors missing from the comparison period count as zero).
 *
 * @param primary    - Primary period top-authors data
 * @param comparison - Comparison period top-authors data
 * @param maxEntries - Maximum number of entries to include in the leaderboard
 * @return Processed data ready for LeaderboardChart component
 */
export function buildTopAuthorsData(
	primary: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	comparison: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	maxEntries = 7
): LeaderboardChartData {
	const primaryAuthors = summarizeAuthors( primary );

	if ( primaryAuthors.length === 0 ) {
		return [];
	}

	const comparisonViews = new Map(
		summarizeAuthors( comparison ).map( author => [ author.label, author.views ] )
	);

	const data = primaryAuthors.slice( 0, maxEntries );

	// Find the max value for share calculation
	const maxValue = Math.max(
		...data.map( author => Math.max( author.views, comparisonViews.get( author.label ) ?? 0 ) ),
		1 // Prevent division by zero
	);

	return data.map( author => {
		const currentValue = author.views;
		const previousValue = comparisonViews.get( author.label ) ?? 0;
		const delta = calculateDelta( currentValue, previousValue );

		return {
			id: author.label,
			label: author.label,
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta,
		};
	} );
}
