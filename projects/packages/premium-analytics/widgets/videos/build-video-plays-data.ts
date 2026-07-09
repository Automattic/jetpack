/**
 * External dependencies
 */
import {
	calculateDelta,
	getVideoKey,
	getVideoLabel,
	toVideoItems,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

/**
 * Builds leaderboard chart data for the Videos widget.
 *
 * Transforms Jetpack Stats video-plays data into the format required by
 * LeaderboardChart, with comparison values aligned by video (videos missing
 * from the comparison period count as zero).
 *
 * @param primary    - Primary period video-plays report
 * @param comparison - Comparison period video-plays report
 * @return Processed data ready for the LeaderboardChart component
 */
export function buildVideoPlaysData(
	primary: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	comparison: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): LeaderboardChartData {
	const videos = toVideoItems( primary );

	if ( videos.length === 0 ) {
		return [];
	}

	const comparisonPlays = new Map(
		toVideoItems( comparison ).map( video => [ getVideoKey( video ), video.plays ] )
	);

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...videos.map( video =>
			Math.max( video.plays, comparisonPlays.get( getVideoKey( video ) ) ?? 0 )
		),
		1
	);

	return videos.map( video => {
		const key = getVideoKey( video );
		const currentValue = video.plays;
		const previousValue = comparisonPlays.get( key ) ?? 0;

		return {
			id: key,
			label: getVideoLabel( video ),
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta: calculateDelta( currentValue, previousValue ),
		};
	} );
}
