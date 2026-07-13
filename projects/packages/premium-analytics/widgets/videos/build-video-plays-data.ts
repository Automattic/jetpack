/**
 * External dependencies
 */
import {
	calculateDelta,
	getVideoKey,
	getVideoLabel,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';

export type VideoPlaysDataResult = {
	data: LeaderboardChartData;
	hasComparison: boolean;
};

/**
 * Builds leaderboard chart data for the Videos widget.
 *
 * Transforms already-merged Jetpack Stats video-plays rows into the format
 * required by LeaderboardChart.
 *
 * @param videos - Merged video-plays rows from the Stats data layer.
 * @return Processed data ready for the LeaderboardChart component
 */
export function buildVideoPlaysData(
	videos: StatsVideoPlaysComparisonItem[] = []
): LeaderboardChartData {
	return buildVideoPlaysDataWithComparison( videos ).data;
}

/**
 * Builds leaderboard chart data and reports whether any visible video has
 * comparison-period data.
 *
 * @param videos - Merged video-plays rows from the Stats data layer.
 * @return Processed data and row-overlap comparison state.
 */
export function buildVideoPlaysDataWithComparison(
	videos: StatsVideoPlaysComparisonItem[] = []
): VideoPlaysDataResult {
	if ( videos.length === 0 ) {
		return { data: [], hasComparison: false };
	}

	const rows = videos.map( video => ( {
		id: getVideoKey( video ),
		label: getVideoLabel( video ),
		currentValue: video.plays,
		previousValue: video.previousPlays,
	} ) );
	const hasComparison = rows.some( video => video.previousValue !== undefined );

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...rows.map( video => Math.max( video.currentValue, video.previousValue ?? 0 ) ),
		1
	);

	return {
		data: rows.map( video => ( {
			...video,
			currentShare: ( video.currentValue / maxValue ) * 100,
			previousShare:
				video.previousValue !== undefined ? ( video.previousValue / maxValue ) * 100 : undefined,
			delta:
				video.previousValue !== undefined
					? calculateDelta( video.currentValue, video.previousValue )
					: undefined,
		} ) ),
		hasComparison,
	};
}
