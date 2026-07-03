/**
 * External dependencies
 */
import {
	calculateDelta,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { mergeStatsComparisonRows } from '@jetpack-premium-analytics/data';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

/**
 * Resolve a display label for a video, falling back to a translated
 * "Untitled video" label when the API provides none.
 *
 * @param video - The video-plays item.
 * @return The video's display label.
 */
function getVideoLabel( video: StatsVideoPlaysItem ) {
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
function getVideoKey( video: StatsVideoPlaysItem ) {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}

/**
 * Flatten a normalized video-plays report into its per-video items. The Stats
 * query layer summarizes multi-day ranges server-side and the endpoint returns
 * videos already ranked and limited by `max`, so the report carries a single
 * data point of per-video totals — mirroring how the Authors widget reads its
 * report.
 *
 * @param report - The normalized video-plays report, or undefined while loading.
 * @return The per-video items for the period.
 */
function toVideoItems(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): StatsVideoPlaysItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

export type VideoPlaysDataResult = {
	data: LeaderboardChartData;
	hasComparison: boolean;
};

/**
 * Builds leaderboard chart data for the Videos widget.
 *
 * Transforms Jetpack Stats video-plays data into the format required by
 * LeaderboardChart, with comparison values aligned by video. The render layer
 * decides whether comparison UI is enabled based on visible row overlap.
 *
 * @param primary    - Primary period video-plays report
 * @param comparison - Comparison period video-plays report
 * @return Processed data ready for the LeaderboardChart component
 */
export function buildVideoPlaysData(
	primary: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	comparison: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): LeaderboardChartData {
	return buildVideoPlaysDataWithComparison( primary, comparison ).data;
}

/**
 * Builds leaderboard chart data and reports whether any visible video has a
 * matching comparison-period row.
 *
 * @param primary    - Primary period video-plays report
 * @param comparison - Comparison period video-plays report
 * @return Processed data and row-overlap comparison state.
 */
export function buildVideoPlaysDataWithComparison(
	primary: StatsNormalizedReport< StatsVideoPlaysItem > | undefined,
	comparison: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): VideoPlaysDataResult {
	const videos = toVideoItems( primary );

	if ( videos.length === 0 ) {
		return { data: [], hasComparison: false };
	}

	const { rows, hasComparison } = mergeStatsComparisonRows( {
		primaryRows: videos,
		comparisonRows: toVideoItems( comparison ),
		getPrimaryKey: getVideoKey,
		getComparisonKey: getVideoKey,
		getComparisonValue: video => video.plays,
		mapRow: ( video, { previousValue } ) => ( {
			id: getVideoKey( video ),
			label: getVideoLabel( video ),
			currentValue: video.plays,
			previousValue,
		} ),
	} );

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
