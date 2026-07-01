/**
 * External dependencies
 */
import {
	calculateDelta,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

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
function getAuthorLabel( author: StatsTopAuthorsItem ) {
	const label = typeof author.label === 'string' ? author.label : '';

	if ( ! label || label === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics' );
	}

	return label;
}

/**
 * Flatten a normalized top-authors report into its per-author items. The Stats
 * query layer summarizes multi-day ranges server-side and the endpoint returns
 * authors already ranked and limited by `max`, so the report carries a single
 * data point of per-author totals — mirroring how the Top posts widget reads
 * its report.
 *
 * @param report - The normalized top-authors report, or undefined while loading.
 * @return The per-author items for the period.
 */
function toAuthorItems(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): StatsTopAuthorsItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

/**
 * Builds leaderboard chart data for the Authors widget.
 *
 * Transforms Jetpack Stats top-authors data into the format required by
 * LeaderboardChart, with comparison values aligned by author display label
 * (authors missing from the comparison period count as zero).
 *
 * @param primary    - Primary period top-authors report
 * @param comparison - Comparison period top-authors report
 * @return Processed data ready for the LeaderboardChart component
 */
export function buildTopAuthorsData(
	primary: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	comparison: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): LeaderboardChartData {
	const authors = toAuthorItems( primary );

	if ( authors.length === 0 ) {
		return [];
	}

	const comparisonViews = new Map(
		toAuthorItems( comparison ).map( author => [ getAuthorLabel( author ), author.views ] )
	);

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...authors.map( author =>
			Math.max( author.views, comparisonViews.get( getAuthorLabel( author ) ) ?? 0 )
		),
		1
	);

	return authors.map( author => {
		const label = getAuthorLabel( author );
		const currentValue = author.views;
		const previousValue = comparisonViews.get( label ) ?? 0;

		return {
			id: label,
			label,
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta: calculateDelta( currentValue, previousValue ),
		};
	} );
}
