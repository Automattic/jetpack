/**
 * External dependencies
 */
import {
	calculateDelta,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';

/**
 * Resolve a display label for a video, falling back to a translated
 * "Untitled video" label when the API provides none.
 *
 * @param video - The video-plays item.
 * @return The video's display label.
 */
function getVideoLabel( video: StatsVideoPlaysComparisonItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics' );
}

/**
 * Resolve the key used to align a video across the primary and comparison
 * periods, and to identify its leaderboard row. Prefers the stable post ID,
 * then the video URL, and only falls back to the display label when the API
 * omits both — so multiple untitled videos don't collapse onto one key.
 *
 * @param video - The video-plays item.
 * @return The alignment key.
 */
function getVideoKey( video: StatsVideoPlaysComparisonItem ) {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}

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
