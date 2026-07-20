/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

/**
 * Shared helpers for widgets built on the Stats `video-plays` report
 * (`jpa/videopress`). Comparison-row matching lives in the data layer
 * (`mergeStatsVideoPlaysComparisonRows`); these cover the presentation
 * concerns widgets resolve per row.
 */

/**
 * Resolve a display label for a video, falling back to a translated
 * "Untitled video" label when the API provides none.
 *
 * @param video - The video-plays item.
 * @return The video's display label.
 */
export function getVideoLabel( video: StatsVideoPlaysItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics' );
}

/**
 * Resolve the key identifying a video's leaderboard row. Prefers the stable
 * post ID, then the video URL, and only falls back to the display label when
 * the API omits both — so multiple untitled videos don't collapse onto one key.
 *
 * @param video - The video-plays item.
 * @return The row key.
 */
export function getVideoKey( video: StatsVideoPlaysItem ) {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}
