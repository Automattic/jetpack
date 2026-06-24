/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { calculateDelta } from './calculate-delta';
import type { LeaderboardChartData } from '../components/chart-leaderboard';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

type TopAuthorLeaderboardEntry = {
	// Stable key used to dedup and to align primary/comparison periods. Prefer
	// the author id; fall back to the display label when no id is available.
	key: string;
	label: string;
	views: number;
};

function getAuthorLabel( author: StatsTopAuthorsItem ) {
	return typeof author.label === 'string' && author.label
		? author.label
		: __( 'Untracked authors', 'jetpack-premium-analytics' );
}

function getAuthorKey( author: StatsTopAuthorsItem, label: string ) {
	return author.id !== undefined && author.id !== null ? String( author.id ) : label;
}

function summarizeAuthors(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): TopAuthorLeaderboardEntry[] {
	const authorViews = new Map< string, TopAuthorLeaderboardEntry >();

	for ( const dataPoint of report?.data ?? [] ) {
		for ( const author of dataPoint.items ) {
			const label = getAuthorLabel( author );
			const key = getAuthorKey( author, label );
			const existing = authorViews.get( key );

			authorViews.set( key, {
				key,
				label: existing?.label ?? label,
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
 * LeaderboardChart, with comparison values aligned by author (by stable author
 * id, falling back to display name when none is available; authors missing from
 * the comparison period count as zero).
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
		summarizeAuthors( comparison ).map( author => [ author.key, author.views ] )
	);

	const data = primaryAuthors.slice( 0, maxEntries );

	// Find the max value for share calculation
	const maxValue = Math.max(
		...data.map( author => Math.max( author.views, comparisonViews.get( author.key ) ?? 0 ) ),
		1 // Prevent division by zero
	);

	return data.map( author => {
		const currentValue = author.views;
		const previousValue = comparisonViews.get( author.key ) ?? 0;
		const delta = calculateDelta( currentValue, previousValue );

		return {
			id: author.key,
			label: author.label,
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta,
		};
	} );
}
