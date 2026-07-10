/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

/**
 * Shared helpers for widgets built on the Stats `video-plays` report
 * (`jpa/videos`, `jpa/videopress`). Each widget keeps its own row builder;
 * these cover the report-shape concerns they have in common.
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
 * Resolve the key used to align a video across the primary and comparison
 * periods, and to identify its leaderboard row. Prefers the stable post ID,
 * then the video URL, and only falls back to the display label when the API
 * omits both — so multiple untitled videos don't collapse onto one key.
 *
 * @param video - The video-plays item.
 * @return The alignment key.
 */
export function getVideoKey( video: StatsVideoPlaysItem ) {
	if ( video.id != null ) {
		return String( video.id );
	}

	return video.link || getVideoLabel( video );
}

/**
 * Flatten a normalized video-plays report into its per-video items. The Stats
 * query layer summarizes multi-day ranges server-side and the endpoint returns
 * videos already ranked and limited by `max`, so the report carries a single
 * data point of per-video totals.
 *
 * @param report - The normalized video-plays report, or undefined while loading.
 * @return The per-video items for the period.
 */
export function toVideoItems(
	report: StatsNormalizedReport< StatsVideoPlaysItem > | undefined
): StatsVideoPlaysItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}
