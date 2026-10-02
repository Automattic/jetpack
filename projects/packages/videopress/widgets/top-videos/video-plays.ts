/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsVideoPlaysComparisonItem } from '@automattic/jetpack-premium-analytics-sdk';

/**
 * Resolve a display label for a video, falling back to a translated
 * "Untitled video" label when the API provides none.
 *
 * @param video - The video-plays item.
 * @return The video's display label.
 */
export function getVideoLabel( video: StatsVideoPlaysComparisonItem ): string {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-videopress-pkg' );
}

/**
 * Resolve the key identifying a video's leaderboard row. Prefers the stable
 * post ID, then the video URL, and only falls back to the display label when
 * the API omits both, so multiple untitled videos don't collapse onto one key.
 *
 * @param video - The video-plays item.
 * @return The row key.
 */
export function getVideoKey( video: StatsVideoPlaysComparisonItem ): string {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}
